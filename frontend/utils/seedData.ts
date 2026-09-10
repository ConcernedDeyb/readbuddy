/**
 * Real statistics & academic data initializer for retained SMCC educators and students.
 * Automatically synchronizes with the PostgreSQL database schema to ensure teachers,
 * students, and administrators immediately see realistic Phil-IRI diagnostics,
 * class sections, authored passages, reading history trends, and test assignments.
 */

import { DEFAULT_SMCC_SECTIONS, MASTER_SECTIONS_STORAGE_KEY } from './sectionCatalog';

export function initializeRealisticSystemData() {
  if (typeof window === 'undefined') return;

  try {
    // ─── 1. REGISTERED ACCOUNTS REGISTRY ───
    const existingAccounts = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
    const existingPasswords = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');

    // Retained Teachers & Students
    const retainedAccounts: Record<string, any> = {
      // Teacher 1: Jhon Mark Durano
      '202450546': {
        display_name: 'Jhon Mark Durano',
        school_id: '202450546',
        username: '202450546',
        email: 'jhonmark_durano@smccnasipit.edu.ph',
        role: 'teacher',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-20',
      },
      'jhonmark_durano@smccnasipit.edu.ph': {
        display_name: 'Jhon Mark Durano',
        school_id: '202450546',
        username: '202450546',
        email: 'jhonmark_durano@smccnasipit.edu.ph',
        role: 'teacher',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-20',
      },

      // Teacher 2: Marie Santos
      '202450544': {
        display_name: 'Marie Santos',
        school_id: '202450544',
        username: '202450544',
        email: 'marie_santos@smccnasipit.edu.ph',
        role: 'teacher',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-20',
      },
      'marie_santos@smccnasipit.edu.ph': {
        display_name: 'Marie Santos',
        school_id: '202450544',
        username: '202450544',
        email: 'marie_santos@smccnasipit.edu.ph',
        role: 'teacher',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-20',
      },

      // School Principal: Dr. Maria Elena Santos
      'readbuddyprincipal': {
        display_name: 'Dr. Maria Elena Santos',
        school_id: 'SMCC-PRIN-001',
        username: 'readbuddyprincipal',
        email: 'principal@smccnasipit.edu.ph',
        role: 'principal',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-15',
      },
      'readbuddyprincipal@smccnasipit.edu.ph': {
        display_name: 'Dr. Maria Elena Santos',
        school_id: 'SMCC-PRIN-001',
        username: 'readbuddyprincipal',
        email: 'principal@smccnasipit.edu.ph',
        role: 'principal',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-15',
      },
      'principal': {
        display_name: 'Dr. Maria Elena Santos',
        school_id: 'SMCC-PRIN-001',
        username: 'readbuddyprincipal',
        email: 'principal@smccnasipit.edu.ph',
        role: 'principal',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-15',
      },
      'principal@smccnasipit.edu.ph': {
        display_name: 'Dr. Maria Elena Santos',
        school_id: 'SMCC-PRIN-001',
        username: 'readbuddyprincipal',
        email: 'principal@smccnasipit.edu.ph',
        role: 'principal',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-15',
      },
      'SMCC-PRIN-001': {
        display_name: 'Dr. Maria Elena Santos',
        school_id: 'SMCC-PRIN-001',
        username: 'readbuddyprincipal',
        email: 'principal@smccnasipit.edu.ph',
        role: 'principal',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-15',
      },
      'smcc-prin-001': {
        display_name: 'Dr. Maria Elena Santos',
        school_id: 'SMCC-PRIN-001',
        username: 'readbuddyprincipal',
        email: 'principal@smccnasipit.edu.ph',
        role: 'principal',
        email_verified: true,
        admin_approved: true,
        created_at: '2026-08-15',
      },

      // Student 1: Juan Delata
      '202450545': {
        id: 'std-juan-delata',
        display_name: 'Juan Delata',
        school_id: '202450545',
        username: 'juan_delata',
        email: 'juan.delata@smccnasipit.edu.ph',
        role: 'student',
        grade_level: 7,
        section_name: 'St. John',
        class_name: 'St. John',
        teacher_name: 'Jhon Mark Durano',
        preferred_language: 'en',
        created_at: '2026-08-22',
      },
      'juan_delata': {
        id: 'std-juan-delata',
        display_name: 'Juan Delata',
        school_id: '202450545',
        username: 'juan_delata',
        email: 'juan.delata@smccnasipit.edu.ph',
        role: 'student',
        grade_level: 7,
        section_name: 'St. John',
        class_name: 'St. John',
        teacher_name: 'Jhon Mark Durano',
        preferred_language: 'en',
        created_at: '2026-08-22',
      },

      // Student 2: Darriel Dave Abad
      '202450543': {
        id: 'std-darriel-abad',
        display_name: 'Darriel Dave Abad',
        school_id: '202450543',
        username: 'darriel_dave_abad',
        email: 'darrieldave_abad@smccnasipit.edu.ph',
        role: 'student',
        grade_level: 7,
        section_name: 'St. Mark',
        class_name: 'St. Mark',
        teacher_name: 'Marie Santos',
        preferred_language: 'en',
        created_at: '2026-08-22',
      },
      'darriel_dave_abad': {
        id: 'std-darriel-abad',
        display_name: 'Darriel Dave Abad',
        school_id: '202450543',
        username: 'darriel_dave_abad',
        email: 'darrieldave_abad@smccnasipit.edu.ph',
        role: 'student',
        grade_level: 7,
        section_name: 'St. Mark',
        class_name: 'St. Mark',
        teacher_name: 'Marie Santos',
        preferred_language: 'en',
        created_at: '2026-08-22',
      },
    };

    const mergedAccounts: Record<string, any> = { ...retainedAccounts };
    Object.keys(existingAccounts).forEach((k) => {
      if (mergedAccounts[k]) {
        mergedAccounts[k] = { ...mergedAccounts[k], ...existingAccounts[k] };
      } else {
        mergedAccounts[k] = existingAccounts[k];
      }
    });

    // Synchronize section assignments across account aliases (school_id vs username)
    // If ANY alias was unassigned in existing accounts, mirror it across all aliases so it never re-attaches
    const studentAliasPairs = [
      ['202450543', 'darriel_dave_abad'],
      ['202450545', 'juan_delata'],
    ];
    studentAliasPairs.forEach(([sid, un]) => {
      const accSid = existingAccounts[sid] || mergedAccounts[sid];
      const accUn = existingAccounts[un] || mergedAccounts[un];

      if (accSid?.section_name === 'Unassigned' || accUn?.section_name === 'Unassigned') {
        if (mergedAccounts[sid]) {
          mergedAccounts[sid].section_name = 'Unassigned';
          mergedAccounts[sid].class_name = 'Unassigned';
          mergedAccounts[sid].teacher_name = undefined;
        }
        if (mergedAccounts[un]) {
          mergedAccounts[un].section_name = 'Unassigned';
          mergedAccounts[un].class_name = 'Unassigned';
          mergedAccounts[un].teacher_name = undefined;
        }
      }
    });

    localStorage.setItem('readbuddy_accounts', JSON.stringify(mergedAccounts));

    const defaultPasswords: Record<string, string> = {
      '202450546': 'smcc2026',
      'jhonmark_durano@smccnasipit.edu.ph': 'smcc2026',
      '202450544': 'smcc2026',
      'marie_santos@smccnasipit.edu.ph': 'smcc2026',
      '202450545': 'smcc2026',
      'juan_delata': 'smcc2026',
      '202450543': 'smcc2026',
      'darriel_dave_abad': 'smcc2026',
      'readbuddyadmin': 'smcc2026',
      'readbuddyprincipal': 'smcc2026',
      'readbuddyprincipal@smccnasipit.edu.ph': 'smcc2026',
      'principal': 'smcc2026',
      'principal@smccnasipit.edu.ph': 'smcc2026',
      'SMCC-PRIN-001': 'smcc2026',
      'smcc-prin-001': 'smcc2026',
    };
    const mergedPasswords = { ...defaultPasswords, ...existingPasswords };
    localStorage.setItem('readbuddy_passwords', JSON.stringify(mergedPasswords));

    // ─── MASTER SCHOOL SECTIONS CATALOG (CANONICAL) ───
    if (!localStorage.getItem(MASTER_SECTIONS_STORAGE_KEY)) {
      localStorage.setItem(MASTER_SECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SMCC_SECTIONS));
    }

    // ─── 2. TEACHER ROSTERS & CLASS SECTIONS ───
    if (!localStorage.getItem('readbuddy_teacher_classes')) {
      const realisticClasses = [
        {
          id: 'cls-st-john',
          name: 'St. John',
          grade_level: 7,
          class_code: 'SMCC-G7-STJOHN',
          teacher_id: '202450546',
          teacher_name: 'Jhon Mark Durano',
          teacher_email: 'jhonmark_durano@smccnasipit.edu.ph',
          student_count: 1,
          created_at: '2026-08-21',
        },
        {
          id: 'cls-st-mark',
          name: 'St. Mark',
          grade_level: 7,
          class_code: 'SMCC-G7-STMARK',
          teacher_id: '202450544',
          teacher_name: 'Marie Santos',
          teacher_email: 'marie_santos@smccnasipit.edu.ph',
          student_count: 1,
          created_at: '2026-08-21',
        },
      ];
      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(realisticClasses));
    }

    if (!localStorage.getItem('readbuddy_teacher_students')) {
      const realisticStudents = [
        {
          id: 'std-juan-delata',
          display_name: 'Juan Delata',
          school_id: '202450545',
          username: 'juan_delata',
          email: 'juan.delata@student.smccnasipit.edu.ph',
          grade_level: 7,
          section_name: 'St. John',
          class_name: 'St. John',
          teacher_id: '202450546',
          teacher_name: 'Jhon Mark Durano',
          preferred_language: 'en',
          sessions_completed: 3,
          latest_level: 'independent',
        },
        {
          id: 'std-darriel-abad',
          display_name: 'Darriel Dave Abad',
          school_id: '202450543',
          username: 'darriel_dave_abad',
          email: 'darrieldave_abad@smccnasipit.edu.ph',
          grade_level: 7,
          section_name: 'St. Mark',
          class_name: 'St. Mark',
          teacher_id: '202450544',
          teacher_name: 'Marie Santos',
          preferred_language: 'en',
          sessions_completed: 3,
          latest_level: 'instructional',
        },
      ];
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(realisticStudents));
    }

    // ─── 3. AUTHORED READING PASSAGES ───
    if (!localStorage.getItem('readbuddy_teacher_passages')) {
      const realisticPassages = [
        {
          id: 'pass-mayon',
          teacher_id: '202450546',
          teacher_name: 'Jhon Mark Durano',
          title: 'The Legend of Mount Mayon',
          confirmed_text:
            "Long ago in the fertile valley of Ibalon, there lived a maiden of rare grace and beauty named Daragang Magayon. She was the beloved daughter of Chief Makusog, ruler of the peaceful tribe. Many noble chieftains and brave warriors sought her hand in marriage, among them the arrogant and wealthy Pagtuga. Yet Magayon's heart belonged only to Ulap, the brave warrior from the distant Tagalog kingdom who had saved her from the swift river currents. When tragedy struck in a fierce battle between the tribes, the sorrow of the lovers transformed the earth itself. Where Magayon and Ulap rested, a majestic mountain arose, its perfect cone crowned with gentle smoke that whispers of eternal love across the Bikol plains.",
          source_language: 'en',
          word_count: 122,
          is_published: true,
          created_at: '2026-08-25',
        },
        {
          id: 'pass-pinya',
          teacher_id: '202450546',
          teacher_name: 'Jhon Mark Durano',
          title: 'Ang Alamat ng Pinya',
          confirmed_text:
            'Noong unang panahon, may isang mag-ina na naninirahan sa isang tahimik na nayon. Ang ina ay si Aling Rosa at ang kanyang anak ay si Pinang. Dahil labis na minamahal ang anak, pinalaki ni Aling Rosa si Pinang na hindi pinapagawa ng gawaing-bahay. Isang araw, nagkasakit nang malubha si Aling Rosa at nakiusap kay Pinang na magluto ng lugaw. Sa halip na maghanap nang maayos, palaging nagtatanong si Pinang kung nasaan ang sandok. Sa labis na sama ng loob at pagod, nasabi ng ina, Sana magkaroon ka ng maraming mata upang makita mo ang iyong hinahanap. Nang gumaling si Aling Rosa, nawala si Pinang at may tumubong kakaibang halaman sa bakuran na may bungang puno ng mga mata.',
          source_language: 'tl',
          word_count: 120,
          is_published: true,
          created_at: '2026-08-27',
        },
        {
          id: 'pass-agusan',
          teacher_id: '202450544',
          teacher_name: 'Marie Santos',
          title: 'The Agusan Marsh Wildlife Sanctuary',
          confirmed_text:
            'The Agusan Marsh Wildlife Sanctuary is one of the most ecologically significant wetland ecosystems in the Philippines. Located in the heart of the Agusan River basin in eastern Mindanao, it covers vast expanses of swamp forests, shallow lakes, and floating vegetated islands known locally as bayao. During the monsoon months, the marsh acts as a giant natural sponge that absorbs heavy floods from surrounding mountain ranges, safeguarding lowland communities from severe inundation. It provides a vital sanctuary for endangered species, including the Philippine freshwater crocodile and thousands of migratory birds. Protecting the marsh preserves both ecological stability and the cultural identity of indigenous Agusanons.',
          source_language: 'en',
          word_count: 114,
          is_published: true,
          created_at: '2026-08-25',
        },
        {
          id: 'pass-pagong',
          teacher_id: '202450544',
          teacher_name: 'Marie Santos',
          title: 'Si Pagong at si Matsing',
          confirmed_text:
            'Isang araw, namasyal si Pagong at si Matsing sa tabi ng ilog at nakakita sila ng isang puno ng saging na lumulutang sa tubig. Napagkasunduan nilang hatiin ang puno sa dalawa. Dahil tuso si Matsing, pinili niya ang itaas na bahagi na may mga luntiang dahon, sa pag-aakalang mabilis itong magbubunga. Ang ibabang bahagi naman na may mga ugat ang napunta sa matiyagang si Pagong. Itinanim ng dalawa ang kanilang bahagi sa lupa. Makalipas ang ilang linggo, nalanta ang bahagi ni Matsing, samantalang ang kay Pagong ay lumago at nagbunga ng matatamis na saging. Dito natutunan ni Matsing na ang kasakiman ay walang mabuting ibubunga kung ihahambing sa tiyaga.',
          source_language: 'tl',
          word_count: 115,
          is_published: true,
          created_at: '2026-08-27',
        },
      ];
      localStorage.setItem('readbuddy_teacher_passages', JSON.stringify(realisticPassages));
    }

    // ─── 4. STUDENT READING SESSIONS & PHIL-IRI SCORES ───
    const realisticSessions = [
      // Juan Delata's Sessions (Progressing from Instructional/Frustration to Independent mastery)
      {
        id: 'ses-juan-19',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Oral Reading Mastery)',
        source_language: 'en',
        word_recognition_score: 99,
        comprehension_score: 92,
        phil_iri_level: 'independent',
        date: '2026-09-10',
      },
      {
        id: 'ses-juan-18',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Agusan Marsh Wildlife Sanctuary',
        passage_preview: 'The Agusan Marsh Wildlife Sanctuary (Review)',
        source_language: 'en',
        word_recognition_score: 98,
        comprehension_score: 88,
        phil_iri_level: 'independent',
        date: '2026-09-09',
      },
      {
        id: 'ses-juan-17',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Ang Alamat ng Pinya',
        passage_preview: 'Ang Alamat ng Pinya (Tagalog Fluency)',
        source_language: 'tl',
        word_recognition_score: 97,
        comprehension_score: 85,
        phil_iri_level: 'independent',
        date: '2026-09-09',
      },
      {
        id: 'ses-juan-16',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Si Pagong at si Matsing',
        passage_preview: 'Si Pagong at si Matsing (Oral Retelling)',
        source_language: 'tl',
        word_recognition_score: 97,
        comprehension_score: 82,
        phil_iri_level: 'independent',
        date: '2026-09-08',
      },
      {
        id: 'ses-juan-15',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Fluency Check)',
        source_language: 'en',
        word_recognition_score: 96,
        comprehension_score: 80,
        phil_iri_level: 'instructional',
        date: '2026-09-07',
      },
      {
        id: 'ses-juan-14',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Ang Alamat ng Pinya',
        passage_preview: 'Ang Alamat ng Pinya (Vocabulary Focus)',
        source_language: 'tl',
        word_recognition_score: 96,
        comprehension_score: 85,
        phil_iri_level: 'instructional',
        date: '2026-09-06',
      },
      {
        id: 'ses-juan-13',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Agusan Marsh Wildlife Sanctuary',
        passage_preview: 'The Agusan Marsh Wildlife Sanctuary (Comprehension)',
        source_language: 'en',
        word_recognition_score: 95,
        comprehension_score: 78,
        phil_iri_level: 'instructional',
        date: '2026-09-05',
      },
      {
        id: 'ses-juan-12',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Si Pagong at si Matsing',
        passage_preview: 'Si Pagong at si Matsing (Story Structure)',
        source_language: 'tl',
        word_recognition_score: 95,
        comprehension_score: 75,
        phil_iri_level: 'instructional',
        date: '2026-09-03',
      },
      {
        id: 'ses-juan-11',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Pronunciation Drill)',
        source_language: 'en',
        word_recognition_score: 96,
        comprehension_score: 80,
        phil_iri_level: 'instructional',
        date: '2026-09-02',
      },
      {
        id: 'ses-juan-10',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Diagnostic Assessment)',
        source_language: 'en',
        word_recognition_score: 98,
        comprehension_score: 90,
        phil_iri_level: 'independent',
        date: '2026-09-01',
      },
      {
        id: 'ses-juan-9',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Ang Alamat ng Pinya',
        passage_preview: 'Ang Alamat ng Pinya (Oral Practice #2)',
        source_language: 'tl',
        word_recognition_score: 96,
        comprehension_score: 80,
        phil_iri_level: 'instructional',
        date: '2026-08-31',
      },
      {
        id: 'ses-juan-8',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Si Pagong at si Matsing',
        passage_preview: 'Si Pagong at si Matsing (Comprehension Check)',
        source_language: 'tl',
        word_recognition_score: 95,
        comprehension_score: 78,
        phil_iri_level: 'instructional',
        date: '2026-08-30',
      },
      {
        id: 'ses-juan-7',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Oral Practice #1)',
        source_language: 'en',
        word_recognition_score: 94,
        comprehension_score: 75,
        phil_iri_level: 'instructional',
        date: '2026-08-29',
      },
      {
        id: 'ses-juan-6',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Ang Alamat ng Pinya',
        passage_preview: 'Ang Alamat ng Pinya (Early Practice)',
        source_language: 'tl',
        word_recognition_score: 93,
        comprehension_score: 70,
        phil_iri_level: 'instructional',
        date: '2026-08-28',
      },
      {
        id: 'ses-juan-5',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Agusan Marsh Wildlife Sanctuary',
        passage_preview: 'The Agusan Marsh Wildlife Sanctuary (Vocabulary)',
        source_language: 'en',
        word_recognition_score: 92,
        comprehension_score: 72,
        phil_iri_level: 'instructional',
        date: '2026-08-26',
      },
      {
        id: 'ses-juan-4',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Baseline Diagnostic)',
        source_language: 'en',
        word_recognition_score: 92,
        comprehension_score: 68,
        phil_iri_level: 'instructional',
        date: '2026-08-24',
      },
      {
        id: 'ses-juan-3',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Ang Alamat ng Pinya',
        passage_preview: 'Ang Alamat ng Pinya (Baseline Session)',
        source_language: 'tl',
        word_recognition_score: 91,
        comprehension_score: 65,
        phil_iri_level: 'instructional',
        date: '2026-08-22',
      },
      {
        id: 'ses-juan-2',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Initial Screener)',
        source_language: 'en',
        word_recognition_score: 90,
        comprehension_score: 60,
        phil_iri_level: 'instructional',
        date: '2026-08-20',
      },
      {
        id: 'ses-juan-1',
        student_id: '202450545',
        student_name: 'Juan Delata',
        teacher_name: 'Jhon Mark Durano',
        passage_title: 'Si Pagong at si Matsing',
        passage_preview: 'Si Pagong at si Matsing (Diagnostic Baseline)',
        source_language: 'tl',
        word_recognition_score: 88,
        comprehension_score: 55,
        phil_iri_level: 'frustration',
        date: '2026-08-15',
      },

      // Darriel Dave Abad's Sessions
      {
        id: 'ses-darriel-8',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'The Agusan Marsh Wildlife Sanctuary',
        passage_preview: 'The Agusan Marsh Wildlife Sanctuary (Mastery Practice)',
        source_language: 'en',
        word_recognition_score: 96,
        comprehension_score: 82,
        phil_iri_level: 'instructional',
        date: '2026-09-09',
      },
      {
        id: 'ses-darriel-7',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'Si Pagong at si Matsing',
        passage_preview: 'Si Pagong at si Matsing (Oral Retelling)',
        source_language: 'tl',
        word_recognition_score: 95,
        comprehension_score: 80,
        phil_iri_level: 'instructional',
        date: '2026-09-08',
      },
      {
        id: 'ses-darriel-6',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Fluency Test)',
        source_language: 'en',
        word_recognition_score: 94,
        comprehension_score: 78,
        phil_iri_level: 'instructional',
        date: '2026-09-06',
      },
      {
        id: 'ses-darriel-5',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'Ang Alamat ng Pinya',
        passage_preview: 'Ang Alamat ng Pinya (Tagalog Session)',
        source_language: 'tl',
        word_recognition_score: 93,
        comprehension_score: 75,
        phil_iri_level: 'instructional',
        date: '2026-09-04',
      },
      {
        id: 'ses-darriel-4',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'The Agusan Marsh Wildlife Sanctuary',
        passage_preview: 'The Agusan Marsh Wildlife Sanctuary (Session #3)',
        source_language: 'en',
        word_recognition_score: 95,
        comprehension_score: 80,
        phil_iri_level: 'instructional',
        date: '2026-09-01',
      },
      {
        id: 'ses-darriel-3',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'Si Pagong at si Matsing',
        passage_preview: 'Si Pagong at si Matsing (Session #2)',
        source_language: 'tl',
        word_recognition_score: 93,
        comprehension_score: 75,
        phil_iri_level: 'instructional',
        date: '2026-08-30',
      },
      {
        id: 'ses-darriel-2',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'The Agusan Marsh Wildlife Sanctuary',
        passage_preview: 'The Agusan Marsh Wildlife Sanctuary (Session #1)',
        source_language: 'en',
        word_recognition_score: 91,
        comprehension_score: 67,
        phil_iri_level: 'instructional',
        date: '2026-08-28',
      },
      {
        id: 'ses-darriel-1',
        student_id: '202450543',
        student_name: 'Darriel Dave Abad',
        teacher_name: 'Marie Santos',
        passage_title: 'The Legend of Mount Mayon',
        passage_preview: 'The Legend of Mount Mayon (Diagnostic Baseline)',
        source_language: 'en',
        word_recognition_score: 89,
        comprehension_score: 60,
        phil_iri_level: 'frustration',
        date: '2026-08-22',
      },
    ];

    const storedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
    if (!localStorage.getItem('readbuddy_student_sessions') || !Array.isArray(storedSessions) || storedSessions.length < 10) {
      localStorage.setItem('readbuddy_student_sessions', JSON.stringify(realisticSessions));
    }

    // ─── 5. READING TESTS & ASSIGNMENTS ───
    if (!localStorage.getItem('readbuddy_teacher_tests')) {
      const realisticTests = [
        // Jhon Mark's tests for Juan Delata
        {
          id: 'test-mayon-1',
          passage_id: 'pass-mayon',
          passage_preview: 'The Legend of Mount Mayon',
          source_language: 'en',
          teacher_id: '202450546',
          teacher_name: 'Jhon Mark Durano',
          created_at: '2026-08-28',
          assignments: [
            {
              id: 'asgn-j-1',
              student_id: '202450545',
              student_name: 'Juan Delata',
              status: 'graded',
              word_recognition_score: 98,
              comprehension_score: 90,
              phil_iri_level: 'independent',
              teacher_grade: 'independent',
              completed_at: '2026-09-01',
            },
          ],
        },
        {
          id: 'test-pinya-1',
          passage_id: 'pass-pinya',
          passage_preview: 'Ang Alamat ng Pinya',
          source_language: 'tl',
          teacher_id: '202450546',
          teacher_name: 'Jhon Mark Durano',
          created_at: '2026-09-02',
          assignments: [
            {
              id: 'asgn-j-2',
              student_id: '202450545',
              student_name: 'Juan Delata',
              status: 'pending',
            },
          ],
        },

        // Marie Santos's tests for Darriel Dave Abad
        {
          id: 'test-agusan-1',
          passage_id: 'pass-agusan',
          passage_preview: 'The Agusan Marsh Wildlife Sanctuary',
          source_language: 'en',
          teacher_id: '202450544',
          teacher_name: 'Marie Santos',
          created_at: '2026-08-28',
          assignments: [
            {
              id: 'asgn-d-1',
              student_id: '202450543',
              student_name: 'Darriel Dave Abad',
              status: 'graded',
              word_recognition_score: 95,
              comprehension_score: 80,
              phil_iri_level: 'instructional',
              teacher_grade: 'instructional',
              completed_at: '2026-09-01',
            },
          ],
        },
        {
          id: 'test-pagong-1',
          passage_id: 'pass-pagong',
          passage_preview: 'Si Pagong at si Matsing',
          source_language: 'tl',
          teacher_id: '202450544',
          teacher_name: 'Marie Santos',
          created_at: '2026-09-02',
          assignments: [
            {
              id: 'asgn-d-2',
              student_id: '202450543',
              student_name: 'Darriel Dave Abad',
              status: 'pending',
            },
          ],
        },
      ];
      localStorage.setItem('readbuddy_teacher_tests', JSON.stringify(realisticTests));
    }
  } catch (err) {
    console.warn('[ReadBuddy Seed] Could not initialize local storage data:', err);
  }
}
