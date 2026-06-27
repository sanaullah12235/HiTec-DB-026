'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldAlert,
  GraduationCap,
  UserCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
  Library,
  CreditCard,
  CalendarCheck,
  BarChart3,
  Globe,
  Menu,
  X,
  ChevronRight,
  Users,
  Building2,
  Award,
  LogIn,
  MapPin,
  Phone,
  Mail,
  Target,
  Eye,
  BookMarked,
  FlaskConical,
  Cog,
  HeartPulse,
  Monitor,
  Calculator,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const gatewayCards = [
  {
    role: 'admin',
    title: 'Admin Portal',
    description: 'System oversight, user management, course approvals & analytics',
    icon: ShieldAlert,
    gradient: 'from-blue-600 to-blue-700',
    bgGlow: 'rgba(37,99,235,0.2)',
    href: '/login?role=admin',
  },
  {
    role: 'student',
    title: 'Student Portal',
    description: 'Courses, grades, fee management & library access',
    icon: GraduationCap,
    gradient: 'from-indigo-500 to-indigo-700',
    bgGlow: 'rgba(99,102,241,0.2)',
    href: '/login?role=student',
  },
  {
    role: 'faculty',
    title: 'Faculty Portal',
    description: 'Course management, grading & attendance tracking',
    icon: UserCheck,
    gradient: 'from-teal-500 to-teal-700',
    bgGlow: 'rgba(20,184,166,0.2)',
    href: '/login?role=faculty',
  },
  {
    role: 'librarian',
    title: 'Librarian Portal',
    description: 'Inventory management, circulation & fine tracking',
    icon: BookOpen,
    gradient: 'from-amber-500 to-amber-700',
    bgGlow: 'rgba(234,179,8,0.2)',
    href: '/login?role=librarian',
  },
];

const stats = [
  { label: 'Pass Out Students', value: '6,308+', icon: Award, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-indigo-600/10' },
  { label: 'Registered Students', value: '2,329+', icon: Users, color: 'text-teal-400', bg: 'from-teal-500/20 to-teal-600/10' },
  { label: 'Academic Programs', value: '28+', icon: BookMarked, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/10' },
  { label: 'Faculty Members', value: '123+', icon: UserCheck, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/10' },
  { label: 'Scholarship Fund', value: '197.2M', icon: Landmark, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/10' },
  { label: 'Research Centers', value: '15+', icon: FlaskConical, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/10' },
];

const departments = [
  { name: 'Mechanical Engineering', icon: Cog, color: 'from-blue-500 to-blue-600' },
  { name: 'Electrical Engineering', icon: Monitor, color: 'from-indigo-500 to-indigo-600' },
  { name: 'Computer Science', icon: Monitor, color: 'from-purple-500 to-purple-600' },
  { name: 'Civil Engineering', icon: Building2, color: 'from-teal-500 to-teal-600' },
  { name: 'Biomedical Engineering', icon: HeartPulse, color: 'from-red-500 to-red-600' },
  { name: 'Computer Engineering', icon: Cog, color: 'from-cyan-500 to-cyan-600' },
  { name: 'Business Administration', icon: Landmark, color: 'from-amber-500 to-amber-600' },
  { name: 'Mathematics', icon: Calculator, color: 'from-emerald-500 to-emerald-600' },
];

const floatingFeatures = [
  { icon: Library, label: 'Digital Library', color: 'text-emerald-400' },
  { icon: CreditCard, label: 'Fee Management', color: 'text-blue-400' },
  { icon: CalendarCheck, label: 'Attendance Tracking', color: 'text-purple-400' },
  { icon: BarChart3, label: 'Analytics Dashboard', color: 'text-orange-400' },
  { icon: Globe, label: 'Smart Campus', color: 'text-cyan-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.92]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg-page)]">
      {/* ─── Background Effects ─── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--hero-radial-from)] via-[var(--hero-radial-via)] to-[var(--hero-radial-to)]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(var(--grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-color)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Large floating blobs */}
        <div className="absolute top-1/4 left-[15%] max-md:h-[250px] max-md:w-[250px] h-[500px] w-[500px] animate-float rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-1/3 right-[15%] max-md:h-[200px] max-md:w-[200px] h-[400px] w-[400px] animate-float rounded-full bg-indigo-500/10 blur-[120px]" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 max-md:h-[180px] max-md:w-[180px] h-[350px] w-[350px] animate-float rounded-full bg-teal-500/10 blur-[120px]" style={{ animationDelay: '4s' }} />
        <div className="absolute top-2/3 right-1/4 max-md:h-[150px] max-md:w-[150px] h-[300px] w-[300px] animate-float rounded-full bg-amber-500/8 blur-[100px]" style={{ animationDelay: '3s' }} />
      </div>

      {/* ─── Navigation ─── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-nav)] bg-[var(--nav-bg)] backdrop-blur-2xl transition-colors"
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 sm:px-10 lg:px-16">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-heading)]">
              Hi<span className="text-indigo-400">SUP</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-heading)]">Home</button>
            <button onClick={() => scrollTo('about')} className="text-xs font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-heading)]">About</button>
            <Link href="/admission" className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300">Admission</Link>
            <button onClick={() => scrollTo('portals')} className="text-xs font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-heading)]">Portals</button>
            <button onClick={() => scrollTo('programs')} className="text-xs font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-heading)]">Programs</button>
            <button onClick={() => scrollTo('contact')} className="text-xs font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-heading)]">Contact</button>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:from-indigo-400 hover:to-indigo-500 hover:shadow-indigo-500/40 hover:scale-105"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
            </div>
          </div>

          <button
            className="rounded-lg border border-[var(--border-card)] bg-[var(--badge-bg)] p-2.5 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4 text-white" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="border-t border-[var(--border-card)] bg-[var(--mobile-menu-bg)] backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {[
                { label: 'Home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'About', onClick: () => scrollTo('about') },
                { label: 'Admission', onClick: () => router.push('/admission'), isLink: true },
                { label: 'Portals', onClick: () => scrollTo('portals') },
                { label: 'Programs', onClick: () => scrollTo('programs') },
                { label: 'Contact', onClick: () => scrollTo('contact') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setMobileMenuOpen(false); item.onClick?.(); }}
                  className="rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-body)] transition-colors hover:bg-[var(--mobile-menu-item-hover)]"
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-2 flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen flex-col items-center justify-center px-6"
      >
        <div className="mx-auto w-full max-w-[1200px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--badge-bg)] px-4 py-1.5 text-xs text-[var(--text-body)] backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>HiSUP v2.0 — HITEC Smart University Portal</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="text-[var(--text-heading)]">HITEC</span>{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
                Smart University
              </span>
              <br />
              <span className="text-[var(--text-heading)]">Portal</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-body)] sm:text-base lg:text-lg"
            >
              A unified digital ecosystem connecting students, faculty, administration,
              and library services in one seamless, intelligent platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-[var(--text-heading)] shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:from-indigo-400 hover:to-indigo-500 hover:scale-105 hover:shadow-indigo-500/50"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/admission"
                className="group inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-300 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200 hover:scale-105"
              >
                Apply Now
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => scrollTo('about')}
                className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--btn-subtle-bg)] px-6 py-3 text-sm font-medium text-[var(--text-body)] backdrop-blur-md transition-all duration-300 hover:border-[var(--btn-subtle-border-hover)] hover:bg-[var(--btn-subtle-bg-hover)] hover:text-[var(--text-heading)] hover:scale-105"
              >
                Learn More
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </motion.div>

          {/* Floating features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-12 flex flex-wrap justify-center gap-3"
          >
            {floatingFeatures.map((feature) => (
              <div
                key={feature.label}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--feature-bg)] px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--feature-border-hover)] hover:bg-[var(--feature-bg-hover)] hover:text-[var(--text-body)]"
              >
                <feature.icon className={`h-4 w-4 ${feature.color}`} />
                {feature.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-1"
        >
          <span className="text-[10px] text-[var(--text-muted)]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex h-8 w-5 items-start justify-center rounded-full border border-[var(--scroll-border)] p-1"
          >
            <motion.div className="h-1.5 w-1.5 rounded-full bg-[var(--scroll-dot)]" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ─── About Section ─── */}
      <section id="about" className="relative px-6 py-24">
        <div className="mx-auto w-full max-w-[1600px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-[var(--text-heading)] sm:text-4xl lg:text-5xl">
              About{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                HITEC University
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-4xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base lg:text-lg">
              Located in the historic city of Taxila — one of the world&apos;s oldest centers of learning —
              HITEC University stands at the intersection of a rich intellectual heritage and a dynamic industrial ecosystem.
              Our close association with Heavy Industries Taxila (HIT) provides a distinctive advantage, integrating
              academic knowledge with industrial expertise and technological innovation.
            </p>
          </motion.div>

          {/* Stats Grid — full width, big */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative rounded-2xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--card-bg-from)] to-[var(--card-bg-to)] p-6 backdrop-blur-md transition-all duration-500 hover:border-[var(--card-border-hover)] hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${stat.bg} p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-[var(--text-heading)] sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Vision & Mission */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-card)] [background:var(--vision-bg)] p-8 backdrop-blur-md transition-all duration-500 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-[80px] transition-all duration-500 group-hover:bg-indigo-500/30" />
              <Eye className="relative h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="relative text-xl font-bold text-[var(--text-heading)] mb-3">Our Vision</h3>
              <p className="relative text-sm leading-relaxed text-[var(--text-body)]">
                To be a premier institution to achieve academic excellence, innovative solutions in
                collaboration with industry for sustainable development and socio-economic growth
                with gender equality.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-card)] [background:var(--mission-bg)] p-8 backdrop-blur-md transition-all duration-500 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/10"
            >
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-teal-500/20 blur-[80px] transition-all duration-500 group-hover:bg-teal-500/30" />
              <Target className="relative h-8 w-8 text-teal-400 mb-4" />
              <h3 className="relative text-xl font-bold text-[var(--text-heading)] mb-3">Our Mission</h3>
              <p className="relative text-sm leading-relaxed text-[var(--text-body)]">
                To impart quality education by equipping students with knowledge, research,
                creativity and entrepreneurial skills to compete in the local and global market
                while remaining cognizant of their social and moral responsibility.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Quick Stats ─── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto w-full max-w-[1600px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { label: 'Teachers', value: '123', accent: 'from-indigo-500 to-blue-600' },
              { label: 'Pass Out Students', value: '6,308', accent: 'from-teal-500 to-emerald-600' },
              { label: 'Offered Programs', value: '28', accent: 'from-blue-500 to-indigo-600' },
              { label: 'Registered Students', value: '2,329', accent: 'from-amber-500 to-orange-600' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--card-bg-from)] to-[var(--card-bg-to)] p-6 backdrop-blur-md transition-all duration-500 hover:border-[var(--card-border-hover)] hover:shadow-xl"
              >
                <div className={`absolute top-0 left-0 h-0.5 w-0 bg-gradient-to-r ${stat.accent} transition-all duration-500 group-hover:w-full`} />
                <p className="text-4xl font-bold text-[var(--text-heading)] sm:text-5xl">{stat.value}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Programs / Departments ─── */}
      <section id="programs" className="relative px-6 pb-24">
        <div className="mx-auto w-full max-w-[1600px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-bold text-[var(--text-heading)] sm:text-4xl lg:text-5xl">
              Our{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Departments
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base lg:text-lg">
              HITEC University offers a wide range of programs across engineering, sciences, and management.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {departments.map((dept) => (
              <motion.div
                key={dept.name}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.03 }}
                className="group relative cursor-pointer rounded-2xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--card-bg-from)] to-[var(--card-bg-to)] p-5 backdrop-blur-md transition-all duration-500 hover:border-[var(--card-border-hover)] hover:shadow-xl"
              >
                <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${dept.color} p-3 shadow-lg`}>
                  <dept.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-heading)]">{dept.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Gateway / Portals ─── */}
      <section id="portals" className="relative px-6 pb-24">
        <div className="mx-auto w-full max-w-[1600px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-bold text-[var(--text-heading)] sm:text-4xl lg:text-5xl">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Gateway
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base lg:text-lg">
              Select your role to access your personalized dashboard and tools.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {gatewayCards.map((card) => (
              <motion.div
                key={card.role}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -8 }}
                className="group relative cursor-pointer"
                onClick={() => router.push(card.href)}
              >
                <div
                  className="absolute -inset-2 rounded-3xl opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-100"
                  style={{ background: card.bgGlow }}
                />
                <div
                  className="relative rounded-2xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--card-bg-portal)] to-[var(--card-bg-to)] p-6 backdrop-blur-2xl transition-all duration-500 group-hover:border-[var(--card-border-hover)] group-hover:shadow-xl"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -12, 12, 0] }}
                    transition={{ duration: 0.6 }}
                    className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${card.gradient} p-3 shadow-lg`}
                  >
                    <card.icon className="h-6 w-6 text-white" />
                  </motion.div>

                  <h3 className="mb-2 text-lg font-bold text-[var(--text-heading)]">{card.title}</h3>
                  <p className="mb-6 text-xs leading-relaxed text-[var(--text-body)]">
                    {card.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300 transition-colors group-hover:text-[var(--text-heading)]">
                    <span>Enter Portal</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-all group-hover:translate-x-1.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto w-full max-w-[1400px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-card)] [background:var(--cta-bg)] p-10 sm:p-12 lg:p-16">
              <div className="absolute top-0 right-0 h-[400px] w-[400px] translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/20 blur-[120px]" />
              <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full bg-teal-500/20 blur-[120px]" />

              <div className="relative text-center">
                <h2 className="text-3xl font-bold text-[var(--text-heading)] sm:text-4xl lg:text-5xl">
                  Ready to Get Started?
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-body)] sm:text-base lg:text-lg">
                  Join thousands of students, faculty, and staff who use HiSUP to manage their university experience.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-[var(--text-heading)] shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:from-indigo-400 hover:to-indigo-500 hover:scale-105 hover:shadow-indigo-500/50"
                  >
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section id="contact" className="relative px-6 pb-24">
        <div className="mx-auto w-full max-w-[1600px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-bold text-[var(--text-heading)] sm:text-4xl lg:text-5xl">
              Get In{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base lg:text-lg">
              Have questions? Reach out to us.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-6 sm:grid-cols-3"
          >
            {[
              { icon: MapPin, label: 'Address', value: ['HITEC University, Taxila Cantt,', 'Rawalpindi, Punjab 47080, Pakistan'], color: 'text-indigo-400' },
              { icon: Phone, label: 'Phone', value: ['+92-51-94908146-49'], color: 'text-teal-400' },
              { icon: Mail, label: 'Email', value: ['info@hitecuni.edu.pk'], color: 'text-amber-400' },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--card-bg-contact)] to-transparent p-6 text-center backdrop-blur-md transition-all duration-500 hover:border-[var(--card-border-hover)] hover:shadow-xl"
              >
                <item.icon className={`mx-auto mb-3 h-7 w-7 ${item.color} transition-transform group-hover:scale-110`} />
                <h3 className="text-base font-semibold text-[var(--text-heading)] mb-2">{item.label}</h3>
                {item.value.map((v, i) => (
                  <p key={i} className="text-xs text-[var(--text-body)] leading-relaxed">{v}</p>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border-nav)] px-6 py-8">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-400" />
            <p className="text-xs text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} HITEC University Taxila. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
            <span className="cursor-pointer transition-colors hover:text-[var(--text-body)]">Privacy</span>
            <span className="cursor-pointer transition-colors hover:text-[var(--text-body)]">Terms</span>
            <span className="cursor-pointer transition-colors hover:text-[var(--text-body)]">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
