'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Plus, BookMarked } from 'lucide-react';

interface Department { id: string; name: string; code: string; }
interface Course { id: string; department_id: string; name: string; code: string; credits: number; departments?: { name: string }; }
interface Section { id: string; course_id: string; faculty_id: string; section_name: string; semester: string; total_seats: number; allocated_seats: number; courses?: { name: string; code: string }; faculty?: { name: string }; }

export default function CoursesPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [faculty, setFaculty] = useState<{ id: string; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({ name: '', code: '', credits: '', department_id: '' });
  const [sectionForm, setSectionForm] = useState({ course_id: '', faculty_id: '', section_name: '', semester: '', total_seats: '' });

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  async function loadData() {
    const [d, c, s, f] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('courses').select('*, departments(name)'),
      supabase.from('sections').select('*, courses(name, code), faculty(name)'),
      supabase.from('faculty').select('id, name'),
    ]);
    setDepartments((d.data ?? []) as Department[]);
    setCourses((c.data ?? []) as Course[]);
    setSections((s.data ?? []) as Section[]);
    setFaculty((f.data ?? []) as { id: string; name: string }[]);
  }

  useEffect(() => { loadData(); }, []);

  const deptCourses = courses.filter((c) => c.department_id === selectedDept || !selectedDept);

  function openAddCourse() {
    setEditingCourse(null);
    setCourseForm({ name: '', code: '', credits: '', department_id: selectedDept || departments[0]?.id || '' });
    setShowCourseForm(true);
  }

  function openEditCourse(row: Record<string, unknown>) {
    setEditingCourse(row.id as string);
    setCourseForm({
      name: row.name as string,
      code: row.code as string,
      credits: String(row.credits ?? ''),
      department_id: row.department_id as string,
    });
    setShowCourseForm(true);
  }

  async function handleSaveCourse() {
    const payload = {
      name: courseForm.name,
      code: courseForm.code,
      credits: parseInt(courseForm.credits),
      department_id: courseForm.department_id,
    };
    if (editingCourse) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editingCourse);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Course updated.');
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Course created.');
    }
    setShowCourseForm(false);
    await loadData();
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm('Delete this course?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Course deleted.');
    await loadData();
  }

  function openAddSection() {
    setEditingSection(null);
    setSectionForm({ course_id: deptCourses[0]?.id || courses[0]?.id || '', faculty_id: '', section_name: '', semester: '', total_seats: '' });
    setShowSectionForm(true);
  }

  function openEditSection(row: Record<string, unknown>) {
    setEditingSection(row.id as string);
    setSectionForm({
      course_id: row.course_id as string,
      faculty_id: row.faculty_id as string,
      section_name: row.section_name as string,
      semester: row.semester as string,
      total_seats: String(row.total_seats ?? ''),
    });
    setShowSectionForm(true);
  }

  async function handleSaveSection() {
    if (!sectionForm.faculty_id || !sectionForm.course_id || !sectionForm.section_name || !sectionForm.semester || !sectionForm.total_seats) {
      addAlert('error', 'All section fields are required.');
      return;
    }
    const payload = {
      course_id: sectionForm.course_id,
      faculty_id: sectionForm.faculty_id,
      section_name: sectionForm.section_name,
      semester: sectionForm.semester,
      total_seats: parseInt(sectionForm.total_seats) || 0,
      allocated_seats: 0,
    };
    if (editingSection) {
      const { error } = await supabase.from('sections').update(payload).eq('id', editingSection);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Section updated.');
    } else {
      const { error } = await supabase.from('sections').insert(payload);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Section created.');
    }
    setShowSectionForm(false);
    await loadData();
  }

  async function handleDeleteSection(id: string) {
    if (!confirm('Delete this section?')) return;
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Section deleted.');
    await loadData();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gradient from-blue-600 to-blue-400">Courses & Sections</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage courses, assign faculty, and create sections</p>
        </div>
      </div>

      <AlertList alerts={alerts} />

      <Select
        label="Filter by Department"
        value={selectedDept}
        onChange={(e) => setSelectedDept(e.target.value)}
        options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Courses" action={<Button onClick={openAddCourse}><Plus className="mr-1 h-4 w-4" />Add Course</Button>}>
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'credits', header: 'Credits' },
              { key: 'dept', header: 'Department', render: (r) => (r.departments as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEditCourse(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDeleteCourse(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={deptCourses as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No courses found. Add one above."
          />
        </Card>

        <Card title="Sections" action={<Button onClick={openAddSection}><Plus className="mr-1 h-4 w-4" />Add Section</Button>}>
          <DataTable
            columns={[
              { key: 'name', header: 'Section', render: (r) => r.section_name as string },
              { key: 'course', header: 'Course', render: (r) => (r.courses as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'faculty', header: 'Faculty', render: (r) => (r.faculty as Record<string, unknown>)?.name as string ?? 'Unassigned' },
              { key: 'semester', header: 'Semester', render: (r) => <Badge>{r.semester as string}</Badge> },
              { key: 'seats', header: 'Seats', render: (r) => `${r.allocated_seats as number}/${r.total_seats as number}` },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEditSection(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDeleteSection(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={sections as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No sections yet."
          />
        </Card>
      </div>

      {showCourseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCourseForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold">{editingCourse ? 'Edit' : 'Add'} Course</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Select label="Department" value={courseForm.department_id} onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })} required options={departments.map((d) => ({ value: d.id, label: d.name }))} />
              <Input label="Course Name" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} required />
              <Input label="Course Code" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} required />
              <Input label="Credits" type="number" value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })} required />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCourseForm(false)}>Cancel</Button>
              <Button onClick={handleSaveCourse}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {showSectionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSectionForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-bold">{editingSection ? 'Edit' : 'Add'} Section</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Select label="Course" value={sectionForm.course_id} onChange={(e) => setSectionForm({ ...sectionForm, course_id: e.target.value })} required options={courses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))} />
              <Select label="Faculty" value={sectionForm.faculty_id} onChange={(e) => setSectionForm({ ...sectionForm, faculty_id: e.target.value })} options={[{ value: '', label: 'Unassigned' }, ...faculty.map((f) => ({ value: f.id, label: f.name }))]} />
              <Input label="Section Name" value={sectionForm.section_name} onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })} placeholder="e.g. A, B, Morning" required />
              <Input label="Semester" value={sectionForm.semester} onChange={(e) => setSectionForm({ ...sectionForm, semester: e.target.value })} placeholder="e.g. 2026F" required />
              <Input label="Total Seats" type="number" value={sectionForm.total_seats} onChange={(e) => setSectionForm({ ...sectionForm, total_seats: e.target.value })} required />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSectionForm(false)}>Cancel</Button>
              <Button onClick={handleSaveSection}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
