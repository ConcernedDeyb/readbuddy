/**
 * Canonical Master School Section Catalog for ReadBuddy
 * Saint Michael College of Caraga (SMCC) Basic Education Department
 * 
 * Provides centralized storage, validation, and standard patron saint sections
 * across Grades 1–12 to permanently prevent duplicate section entries.
 */

export interface MasterSection {
  id: string;
  grade_level: number;
  name: string;
  adviser_id?: string;
  adviser_name?: string;
  status: 'active' | 'archived';
  created_at: string;
}

export const DEFAULT_SMCC_SECTIONS: MasterSection[] = [
  // Elementary (Grades 1–6)
  { id: 'sec-g1-aloysius', grade_level: 1, name: 'St. Aloysius', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g1-agnes', grade_level: 1, name: 'St. Agnes', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g2-clare', grade_level: 2, name: 'St. Clare', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g2-therese', grade_level: 2, name: 'St. Therese', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g3-cecilia', grade_level: 3, name: 'St. Cecilia', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g3-gabriel', grade_level: 3, name: 'St. Gabriel', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g4-tarcisius', grade_level: 4, name: 'St. Tarcisius', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g4-bernadette', grade_level: 4, name: 'St. Bernadette', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g5-martin', grade_level: 5, name: 'St. Martin', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g5-lorenzo', grade_level: 5, name: 'St. Lorenzo', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g6-francis', grade_level: 6, name: 'St. Francis', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g6-dominic', grade_level: 6, name: 'St. Dominic', status: 'active', created_at: '2026-08-01' },

  // Junior High School (Grades 7–10)
  { id: 'sec-g7-st-john', grade_level: 7, name: 'St. John', adviser_name: 'Jhon Mark Durano', adviser_id: '202450546', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g7-st-mark', grade_level: 7, name: 'St. Mark', adviser_name: 'Marie Santos', adviser_id: '202450544', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g7-st-luke', grade_level: 7, name: 'St. Luke', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g7-st-matthew', grade_level: 7, name: 'St. Matthew', status: 'active', created_at: '2026-08-01' },

  { id: 'sec-g8-st-peter', grade_level: 8, name: 'St. Peter', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g8-st-paul', grade_level: 8, name: 'St. Paul', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g8-st-james', grade_level: 8, name: 'St. James', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g8-st-andrew', grade_level: 8, name: 'St. Andrew', status: 'active', created_at: '2026-08-01' },

  { id: 'sec-g9-st-thomas', grade_level: 9, name: 'St. Thomas', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g9-st-augustine', grade_level: 9, name: 'St. Augustine', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g9-st-jude', grade_level: 9, name: 'St. Jude', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g9-st-anthony', grade_level: 9, name: 'St. Anthony', status: 'active', created_at: '2026-08-01' },

  { id: 'sec-g10-st-ignatius', grade_level: 10, name: 'St. Ignatius', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g10-st-michael', grade_level: 10, name: 'St. Michael', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g10-st-raphael', grade_level: 10, name: 'St. Raphael', status: 'active', created_at: '2026-08-01' },

  // Senior High School (Grades 11–12)
  { id: 'sec-g11-calungsod', grade_level: 11, name: 'St. Pedro Calungsod', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g11-ruiz', grade_level: 11, name: 'St. Lorenzo Ruiz', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g12-joseph', grade_level: 12, name: 'St. Joseph', status: 'active', created_at: '2026-08-01' },
  { id: 'sec-g12-padre-pio', grade_level: 12, name: 'St. Padre Pio', status: 'active', created_at: '2026-08-01' },
];

export const MASTER_SECTIONS_STORAGE_KEY = 'readbuddy_master_sections';

/**
 * Retrieve all master sections from localStorage.
 * Initializes with DEFAULT_SMCC_SECTIONS if none exist.
 */
export function getMasterSections(): MasterSection[] {
  if (typeof window === 'undefined') return DEFAULT_SMCC_SECTIONS;
  try {
    const raw = localStorage.getItem(MASTER_SECTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MASTER_SECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SMCC_SECTIONS));
      return DEFAULT_SMCC_SECTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(MASTER_SECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SMCC_SECTIONS));
    return DEFAULT_SMCC_SECTIONS;
  } catch {
    return DEFAULT_SMCC_SECTIONS;
  }
}

/**
 * Save master sections to localStorage and broadcast change event.
 */
export function saveMasterSections(sections: MasterSection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTER_SECTIONS_STORAGE_KEY, JSON.stringify(sections));
    window.dispatchEvent(new Event('readbuddy_master_sections_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to save master sections:', e);
  }
}

/**
 * Retrieve active canonical sections for a specific grade level.
 */
export function getSectionsByGrade(grade: number): MasterSection[] {
  return getMasterSections().filter((s) => s.grade_level === Number(grade) && s.status === 'active');
}

/**
 * Add a new official section to the canonical catalog.
 * Enforces uniqueness of section name within the same grade level.
 */
export function addMasterSection(
  grade_level: number,
  name: string,
  adviser_id?: string,
  adviser_name?: string
): { success: boolean; error?: string; section?: MasterSection } {
  const cleanName = name.trim();
  if (!cleanName) {
    return { success: false, error: 'Section name cannot be empty.' };
  }

  const existing = getMasterSections();
  const duplicate = existing.find(
    (s) => s.grade_level === Number(grade_level) && s.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (duplicate) {
    return {
      success: false,
      error: `Section "${cleanName}" already exists for Grade ${grade_level}. Duplicate sections are prohibited.`,
    };
  }

  const newSec: MasterSection = {
    id: `sec-g${grade_level}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    grade_level: Number(grade_level),
    name: cleanName,
    adviser_id: adviser_id?.trim() || undefined,
    adviser_name: adviser_name?.trim() || undefined,
    status: 'active',
    created_at: new Date().toISOString().split('T')[0],
  };

  const updated = [...existing, newSec];
  saveMasterSections(updated);
  return { success: true, section: newSec };
}

/**
 * Update an existing master section's details.
 */
export function updateMasterSection(
  id: string,
  updates: Partial<MasterSection>
): { success: boolean; error?: string } {
  const existing = getMasterSections();
  const idx = existing.findIndex((s) => s.id === id);
  if (idx === -1) {
    return { success: false, error: 'Section not found.' };
  }

  // Check duplicate if name or grade changed
  const targetGrade = updates.grade_level !== undefined ? updates.grade_level : existing[idx].grade_level;
  const targetName = updates.name !== undefined ? updates.name.trim() : existing[idx].name;

  const duplicate = existing.find(
    (s) => s.id !== id && s.grade_level === targetGrade && s.name.toLowerCase() === targetName.toLowerCase()
  );
  if (duplicate) {
    return {
      success: false,
      error: `A section named "${targetName}" already exists for Grade ${targetGrade}.`,
    };
  }

  existing[idx] = {
    ...existing[idx],
    ...updates,
    name: targetName,
    grade_level: targetGrade,
  };

  saveMasterSections(existing);
  return { success: true };
}

/**
 * Toggle active / archived status of a master section.
 */
export function toggleMasterSectionStatus(id: string): { success: boolean; error?: string } {
  const existing = getMasterSections();
  const idx = existing.findIndex((s) => s.id === id);
  if (idx === -1) {
    return { success: false, error: 'Section not found.' };
  }

  existing[idx].status = existing[idx].status === 'active' ? 'archived' : 'active';
  saveMasterSections(existing);
  return { success: true };
}

/**
 * Permanently delete a section from the master catalog.
 */
export function deleteMasterSection(id: string): { success: boolean; error?: string } {
  const existing = getMasterSections();
  const filtered = existing.filter((s) => s.id !== id);
  if (filtered.length === existing.length) {
    return { success: false, error: 'Section not found.' };
  }
  saveMasterSections(filtered);
  return { success: true };
}
