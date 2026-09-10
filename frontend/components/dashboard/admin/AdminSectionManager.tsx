'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  SectionHeader,
  PrimaryButton,
  GhostButton,
  MUTED,
} from '../_shared';
import {
  MasterSection,
  getMasterSections,
  addMasterSection,
  updateMasterSection,
  toggleMasterSectionStatus,
  deleteMasterSection,
} from '@/utils/sectionCatalog';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Archive,
  Check,
  X,
  School,
  AlertCircle,
} from 'lucide-react';

interface TeacherAccount {
  school_id: string;
  display_name: string;
  email?: string;
}

export function AdminSectionManager({
  accent = '#1F4D3A',
  roleTitle = 'Administrator',
}: {
  accent?: string;
  roleTitle?: string;
}) {
  const [sections, setSections] = useState<MasterSection[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<MasterSection | null>(null);
  const [modalGrade, setModalGrade] = useState('7');
  const [modalName, setModalName] = useState('');
  const [modalAdviserId, setModalAdviserId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  function loadAll() {
    try {
      const list = getMasterSections();
      setSections(list);

      // Load teachers from accounts map
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const teacherList: TeacherAccount[] = [];
      const seenTeacherIds = new Set<string>();

      Object.values(accountsMap).forEach((acc: any) => {
        if (acc.role === 'teacher') {
          const id = acc.school_id || acc.username || acc.email;
          if (id && !seenTeacherIds.has(id.toLowerCase())) {
            seenTeacherIds.add(id.toLowerCase());
            teacherList.push({
              school_id: acc.school_id || acc.username || 'Teacher',
              display_name: acc.display_name || 'Teacher',
              email: acc.email,
            });
          }
        }
      });
      setTeachers(teacherList);

      // Calculate live student count per section name
      const counts: Record<string, number> = {};
      const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const seenStudents = new Set<string>();

      teacherStudents.forEach((st: any) => {
        const sid = (st.school_id || st.username || st.id || '').toLowerCase();
        const sec = (st.section_name || st.class_name || '').trim().toLowerCase();
        if (sid && sec && sec !== 'unassigned' && !seenStudents.has(sid)) {
          seenStudents.add(sid);
          counts[sec] = (counts[sec] || 0) + 1;
        }
      });

      Object.values(accountsMap).forEach((acc: any) => {
        if (acc.role === 'student') {
          const sid = (acc.school_id || acc.username || '').toLowerCase();
          const sec = (acc.section_name || acc.class_name || '').trim().toLowerCase();
          if (sid && sec && sec !== 'unassigned' && !seenStudents.has(sid)) {
            seenStudents.add(sid);
            counts[sec] = (counts[sec] || 0) + 1;
          }
        }
      });

      setStudentCounts(counts);
    } catch (e) {}
  }

  useEffect(() => {
    loadAll();
    window.addEventListener('readbuddy_master_sections_updated', loadAll);
    window.addEventListener('readbuddy_accounts_updated', loadAll);
    window.addEventListener('readbuddy_students_updated', loadAll);
    window.addEventListener('storage', loadAll);
    return () => {
      window.removeEventListener('readbuddy_master_sections_updated', loadAll);
      window.removeEventListener('readbuddy_accounts_updated', loadAll);
      window.removeEventListener('readbuddy_students_updated', loadAll);
      window.removeEventListener('storage', loadAll);
    };
  }, []);

  function handleOpenCreate() {
    setEditingSection(null);
    setModalGrade('7');
    setModalName('');
    setModalAdviserId('');
    setFormError(null);
    setShowModal(true);
  }

  function handleOpenEdit(sec: MasterSection) {
    setEditingSection(sec);
    setModalGrade(String(sec.grade_level));
    setModalName(sec.name);
    setModalAdviserId(sec.adviser_id || '');
    setFormError(null);
    setShowModal(true);
  }

  function handleSaveSection(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const cleanName = modalName.trim();
    if (!cleanName) {
      setFormError('Section name is required.');
      return;
    }

    const matchedTeacher = teachers.find((t) => t.school_id === modalAdviserId);
    const adviserName = matchedTeacher ? matchedTeacher.display_name : undefined;

    if (editingSection) {
      const res = updateMasterSection(editingSection.id, {
        grade_level: Number(modalGrade),
        name: cleanName,
        adviser_id: modalAdviserId || undefined,
        adviser_name: adviserName,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to update section.');
        return;
      }
      setNotification(`Section "${cleanName}" updated successfully!`);
    } else {
      const res = addMasterSection(
        Number(modalGrade),
        cleanName,
        modalAdviserId || undefined,
        adviserName
      );

      if (!res.success) {
        setFormError(res.error || 'Failed to create section.');
        return;
      }
      setNotification(`Official Section "${cleanName}" added to Grade ${modalGrade}!`);
    }

    setTimeout(() => setNotification(null), 5000);
    setShowModal(false);
    loadAll();
  }

  function handleToggleArchive(sec: MasterSection) {
    toggleMasterSectionStatus(sec.id);
    const newStatus = sec.status === 'active' ? 'archived' : 'active';
    setNotification(`Section "${sec.name}" marked as ${newStatus}.`);
    setTimeout(() => setNotification(null), 4000);
    loadAll();
  }

  function handleDelete(sec: MasterSection) {
    const studentCount = studentCounts[sec.name.toLowerCase()] || 0;
    if (studentCount > 0) {
      if (!window.confirm(`Warning: Section "${sec.name}" currently has ${studentCount} enrolled student(s). Are you sure you want to delete this official section?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Delete official section "${sec.name}" for Grade ${sec.grade_level}?`)) {
        return;
      }
    }

    deleteMasterSection(sec.id);
    setNotification(`Section "${sec.name}" deleted from master catalog.`);
    setTimeout(() => setNotification(null), 4000);
    loadAll();
  }

  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchesGrade = gradeFilter === 'all' || s.grade_level === Number(gradeFilter);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.adviser_name && s.adviser_name.toLowerCase().includes(q)) ||
        `grade ${s.grade_level}`.includes(q);
      return matchesGrade && matchesStatus && matchesSearch;
    });
  }, [sections, gradeFilter, statusFilter, search]);

  return (
    <div className="rb-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Official School Sections"
          subtitle={`Master curriculum catalog of verified grades & sections managed by ${roleTitle}. Prevents duplicate classes.`}
          accent={accent}
        />
        <PrimaryButton accent={accent} onClick={handleOpenCreate} className="w-full sm:w-auto">
          <span className="flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Official Section</span>
          </span>
        </PrimaryButton>
      </div>

      {notification && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-xs font-sans font-semibold flex items-center justify-between shadow-sm rb-fade-in-up">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#2E7D4F]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 p-3 rounded-2xl bg-white border border-[#DED2B4] shadow-xs">
        <div className="flex-1 relative flex items-center">
          <span className="absolute left-3 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search section by patron saint name, adviser teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input text-xs w-full !pl-9 !pr-3"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rb-input py-1.5 px-3 text-xs font-bold font-sans"
          >
            <option value="all">All Grades (1–12)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={String(g)}>
                Grade {g}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rb-input py-1.5 px-3 text-xs font-bold font-sans"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </select>

          <span className="text-xs font-mono font-semibold text-gray-500 px-2 py-1 rounded bg-[#FAF7F2] border border-[#DED2B4]">
            {filteredSections.length} Section{filteredSections.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Sections Table */}
      {filteredSections.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border-2 border-dashed border-[#DED2B4]">
          <School className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-serif font-bold text-gray-700">No sections found matching criteria</p>
          <p className="text-xs text-gray-500 font-sans mt-1">Try adjusting the grade filter or search query, or click "+ Add Official Section".</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-[#DED2B4] shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#DED2B4] text-gray-700 font-serif font-bold">
                <th className="py-3 px-4">Grade Level</th>
                <th className="py-3 px-4">Official Section Name</th>
                <th className="py-3 px-4">Assigned Adviser</th>
                <th className="py-3 px-4 text-center">Enrolled Students</th>
                <th className="py-3 px-4 text-center">Catalog Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSections.map((sec) => {
                const sCount = studentCounts[sec.name.toLowerCase()] || 0;
                return (
                  <tr key={sec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#1E3A5F] border border-[#A8C5DA] text-xs font-mono font-bold">
                        Grade {sec.grade_level}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-bold bg-[#EBF3F8] text-[#3D6B8A] border border-[#BBD5E8] shadow-2xs">
                        <Users className="w-3.5 h-3.5 shrink-0 text-[#3D6B8A]" strokeWidth={2.25} />
                        <span>{sec.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {sec.adviser_name ? (
                        <div className="font-sans font-bold text-gray-800">
                          {sec.adviser_name}
                          {sec.adviser_id && (
                            <span className="block text-[11px] font-mono text-gray-400 font-normal">
                              ID: {sec.adviser_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-gray-400 italic">
                          No Adviser Assigned
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        sCount > 0 ? 'bg-[#E6F4EA] text-[#2E7D4F] border border-[#BFE0CC]' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sCount} student{sCount === 1 ? '' : 's'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-sans font-bold uppercase tracking-wider ${
                        sec.status === 'active'
                          ? 'bg-[#EBF7EE] text-[#2E7D4F] border border-[#A3D9B1]'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {sec.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sec)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          title="Edit section details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(sec)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title={sec.status === 'active' ? 'Archive section' : 'Activate section'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sec)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Permanently remove from catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs rb-fade-in">
          <div className="relative w-full max-w-md bg-[#FFFDF8] border-2 border-[#DED2B4] rounded-2xl shadow-xl p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DED2B4]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1F4D3A15] text-[#1F4D3A] flex items-center justify-center shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900">
                    {editingSection ? 'Edit Official Section' : 'Add Official School Section'}
                  </h3>
                  <p className="text-xs text-gray-500 font-sans">
                    Standardized curriculum section for SMCC Basic Education.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSection} className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold font-sans text-gray-700">
                  Grade Level <span className="text-red-500">*</span>
                </span>
                <select
                  value={modalGrade}
                  onChange={(e) => setModalGrade(e.target.value)}
                  className="rb-input text-xs font-bold"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={String(g)}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold font-sans text-gray-700">
                  Section Name (Patron Saint) <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  placeholder="e.g. St. John, St. Mark, St. Michael"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="rb-input text-xs"
                  required
                  autoFocus
                />
                <span className="text-[11px] text-gray-400 font-sans">
                  Use standard SMCC title format (e.g. &quot;St. John&quot;).
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold font-sans text-gray-700">
                  Assigned Section Adviser (Optional)
                </span>
                <select
                  value={modalAdviserId}
                  onChange={(e) => setModalAdviserId(e.target.value)}
                  className="rb-input text-xs"
                >
                  <option value="">-- No Adviser Assigned Yet --</option>
                  {teachers.map((t) => (
                    <option key={t.school_id} value={t.school_id}>
                      {t.display_name} (ID: {t.school_id})
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DED2B4] mt-2">
                <GhostButton onClick={() => setShowModal(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" accent={accent}>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingSection ? 'Save Changes' : 'Create Section'}</span>
                  </span>
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSectionManager;
