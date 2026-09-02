import asyncio
import uuid
import json
from datetime import datetime, timezone, timedelta
from app.db import async_session_maker
from sqlalchemy import select, delete
from app.models import (
    Teacher, Student, Class, Passage, ComprehensionTest,
    ComprehensionQuestion, ReadingSession, TestAssignment
)

async def seed_realistic_data():
    async with async_session_maker() as session:
        t_jhon = await session.scalar(select(Teacher).where(Teacher.school_id == '202450546'))
        t_marie = await session.scalar(select(Teacher).where(Teacher.school_id == '202450544'))
        s_juan = await session.scalar(select(Student).where(Student.school_id == '202450545'))
        s_darriel = await session.scalar(select(Student).where(Student.school_id == '202450543'))

        if not t_jhon or not t_marie or not s_juan or not s_darriel:
            print("Missing required teachers or students:", t_jhon, t_marie, s_juan, s_darriel)
            return

        print(f"Seeding for Teacher Jhon Mark Durano ({t_jhon.id}) and Student Juan Delata ({s_juan.id})")
        print(f"Seeding for Teacher Marie Santos ({t_marie.id}) and Student Darriel Dave Abad ({s_darriel.id})")

        # Clean existing classes, passages, tests, sessions for a clean idempotent run
        await session.execute(delete(TestAssignment))
        await session.execute(delete(ReadingSession))
        await session.execute(delete(ComprehensionQuestion))
        await session.execute(delete(ComprehensionTest))
        await session.execute(delete(Passage))
        await session.execute(delete(Class))

        # 1. Create Class St. John for Jhon Mark Durano
        c_john = Class(
            id=uuid.uuid4(),
            teacher_id=t_jhon.id,
            name='St. John',
            grade_level=7,
            class_code='SMCC-G7-STJOHN',
        )
        session.add(c_john)
        await session.flush()

        # Update Juan Delata
        s_juan.teacher_id = t_jhon.id
        s_juan.class_id = c_john.id
        s_juan.section_name = 'St. John'
        s_juan.grade_level = 7

        # 2. Create Class St. Mark for Marie Santos
        c_mark = Class(
            id=uuid.uuid4(),
            teacher_id=t_marie.id,
            name='St. Mark',
            grade_level=7,
            class_code='SMCC-G7-STMARK',
        )
        session.add(c_mark)
        await session.flush()

        # Update Darriel Dave Abad
        s_darriel.teacher_id = t_marie.id
        s_darriel.class_id = c_mark.id
        s_darriel.section_name = 'St. Mark'
        s_darriel.grade_level = 7

        now = datetime.now(timezone.utc)

        # 3. Passages for Jhon Mark Durano
        p_mayon_text = (
            "Long ago in the fertile valley of Ibalon, there lived a maiden of rare grace and beauty named Daragang Magayon. "
            "She was the beloved daughter of Chief Makusog, ruler of the peaceful tribe. Many noble chieftains and brave warriors "
            "sought her hand in marriage, among them the arrogant and wealthy Pagtuga. Yet Magayon's heart belonged only to Ulap, "
            "the brave warrior from the distant Tagalog kingdom who had saved her from the swift river currents. When tragedy "
            "struck in a fierce battle between the tribes, the sorrow of the lovers transformed the earth itself. Where Magayon "
            "and Ulap rested, a majestic mountain arose, its perfect cone crowned with gentle smoke that whispers of eternal "
            "love across the Bikol plains."
        )

        p_mayon = Passage(
            id=uuid.uuid4(),
            teacher_id=t_jhon.id,
            title='The Legend of Mount Mayon',
            source_type='typed',
            source_language='en',
            raw_extracted_text=p_mayon_text,
            confirmed_text=p_mayon_text,
            word_count=len(p_mayon_text.split()),
            is_published=True,
            created_at=now - timedelta(days=5),
        )
        session.add(p_mayon)
        await session.flush()

        t_mayon = ComprehensionTest(
            id=uuid.uuid4(),
            passage_id=p_mayon.id,
            generated_by_model='gemma3:4b',
            created_at=now - timedelta(days=5),
        )
        session.add(t_mayon)
        await session.flush()

        q1_m = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_mayon.id,
            question_text="Who was Daragang Magayon's father in the legend?",
            question_type='recall',
            choices=json.dumps(['Chief Makusog', 'Pagtuga', 'Ulap', 'Chief Ibalon']),
            correct_choice_index=0,
            order_index=0,
        )
        q2_m = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_mayon.id,
            question_text="Why was the majestic volcano crowned with gentle smoke according to the folklore?",
            question_type='inference',
            choices=json.dumps([
                'It was an angry explosion of tribal war',
                'It symbolizes the eternal presence and sorrow of the two lovers',
                'The villagers kept a watchfire on the summit',
                'Chief Makusog lit a ceremonial beacon'
            ]),
            correct_choice_index=1,
            order_index=1,
        )
        q3_m = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_mayon.id,
            question_text="How can basic education students apply the lessons of Philippine cultural legends?",
            question_type='application',
            choices=json.dumps([
                'By ignoring folklore as ancient fiction',
                'By appreciating how indigenous stories foster respect for nature and national heritage',
                'By memorizing facts without understanding tribal history',
                'By treating historical literature as decorative'
            ]),
            correct_choice_index=1,
            order_index=2,
        )
        session.add_all([q1_m, q2_m, q3_m])

        p_pinya_text = (
            "Noong unang panahon, may isang mag-ina na naninirahan sa isang tahimik na nayon. Ang ina ay si Aling Rosa at "
            "ang kanyang anak ay si Pinang. Dahil labis na minamahal ang anak, pinalaki ni Aling Rosa si Pinang na hindi "
            "pinapagawa ng gawaing-bahay. Isang araw, nagkasakit nang malubha si Aling Rosa at nakiusap kay Pinang na magluto "
            "ng lugaw. Sa halip na maghanap nang maayos, palaging nagtatanong si Pinang kung nasaan ang sandok. Sa labis na "
            "sama ng loob at pagod, nasabi ng ina, Sana magkaroon ka ng maraming mata upang makita mo ang iyong hinahanap. "
            "Nang gumaling si Aling Rosa, nawala si Pinang at may tumubong kakaibang halaman sa bakuran na may bungang puno ng mga mata."
        )

        p_pinya = Passage(
            id=uuid.uuid4(),
            teacher_id=t_jhon.id,
            title='Ang Alamat ng Pinya',
            source_type='typed',
            source_language='tl',
            raw_extracted_text=p_pinya_text,
            confirmed_text=p_pinya_text,
            word_count=len(p_pinya_text.split()),
            is_published=True,
            created_at=now - timedelta(days=3),
        )
        session.add(p_pinya)
        await session.flush()

        t_pinya = ComprehensionTest(
            id=uuid.uuid4(),
            passage_id=p_pinya.id,
            generated_by_model='gemma3:4b',
            created_at=now - timedelta(days=3),
        )
        session.add(t_pinya)
        await session.flush()

        q1_p = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_pinya.id,
            question_text="Bakit hindi pinagagawa ni Aling Rosa ng gawaing-bahay si Pinang noong una?",
            question_type='recall',
            choices=json.dumps(['Dahil mayaman sila', 'Dahil labis na minamahal at pinalaki sa layaw', 'Dahil may katulong sila', 'Dahil nag-aaral si Pinang']),
            correct_choice_index=1,
            order_index=0,
        )
        q2_p = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_pinya.id,
            question_text="Ano ang ipinapahiwatig ng paghiling ng ina na magkaroon ng maraming mata ang anak?",
            question_type='inference',
            choices=json.dumps([
                'Nais niya ng mahiwagang anak',
                'Bunga ito ng pagkadismaya sa kawalan ng kusa at pagtitiyaga ng anak',
                'Nais niyang magbenta ng prutas',
                'Nais niyang turuan ng panggagamot si Pinang'
            ]),
            correct_choice_index=1,
            order_index=1,
        )
        q3_p = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_pinya.id,
            question_text="Paano maipapakita ng kabataan ang kusa at pagtulong sa tahanan?",
            question_type='application',
            choices=json.dumps([
                'Maghintay na magalit ang magulang bago kumilos',
                'Kusang maglinis at tumulong nang bukal sa puso nang hindi na kailangang utusan',
                'Umiwas sa gawaing-bahay sa pamamagitan ng pagtulog',
                'Iasa sa kapatid ang mga obligasyon'
            ]),
            correct_choice_index=1,
            order_index=2,
        )
        session.add_all([q1_p, q2_p, q3_p])

        # 4. Passages for Marie Santos
        p_agusan_text = (
            "The Agusan Marsh Wildlife Sanctuary is one of the most ecologically significant wetland ecosystems in the Philippines. "
            "Located in the heart of the Agusan River basin in eastern Mindanao, it covers vast expanses of swamp forests, "
            "shallow lakes, and floating vegetated islands known locally as bayao. During the monsoon months, the marsh acts as a "
            "giant natural sponge that absorbs heavy floods from surrounding mountain ranges, safeguarding lowland communities from "
            "severe inundation. It provides a vital sanctuary for endangered species, including the Philippine freshwater crocodile "
            "and thousands of migratory birds. Protecting the marsh preserves both ecological stability and the cultural identity "
            "of indigenous Agusanons."
        )

        p_agusan = Passage(
            id=uuid.uuid4(),
            teacher_id=t_marie.id,
            title='The Agusan Marsh Wildlife Sanctuary',
            source_type='typed',
            source_language='en',
            raw_extracted_text=p_agusan_text,
            confirmed_text=p_agusan_text,
            word_count=len(p_agusan_text.split()),
            is_published=True,
            created_at=now - timedelta(days=5),
        )
        session.add(p_agusan)
        await session.flush()

        t_agusan = ComprehensionTest(
            id=uuid.uuid4(),
            passage_id=p_agusan.id,
            generated_by_model='gemma3:4b',
            created_at=now - timedelta(days=5),
        )
        session.add(t_agusan)
        await session.flush()

        q1_a = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_agusan.id,
            question_text="Where is the Agusan Marsh Wildlife Sanctuary situated?",
            question_type='recall',
            choices=json.dumps(['In the Agusan River basin in eastern Mindanao', 'In the highlands of Benguet', 'In western Palawan', 'In central Panay']),
            correct_choice_index=0,
            order_index=0,
        )
        q2_a = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_agusan.id,
            question_text="Why is the marsh ecologically described as a giant natural sponge?",
            question_type='inference',
            choices=json.dumps([
                'Because it is composed of synthetic wetlands',
                'Because it naturally retains torrential floodwaters and protects downstream communities',
                'Because it evaporates water into mountain clouds',
                'Because it filters industrial minerals'
            ]),
            correct_choice_index=1,
            order_index=1,
        )
        q3_a = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_agusan.id,
            question_text="Which community program best supports protecting the Caraga marshland ecosystem?",
            question_type='application',
            choices=json.dumps([
                'Draining wetlands for commercial subdivision estates',
                'Participating in school wetland conservation advocacy and reforestation drives',
                'Discarding agricultural waste into upstream tributaries',
                'Unregulated hunting of migratory waterfowl'
            ]),
            correct_choice_index=1,
            order_index=2,
        )
        session.add_all([q1_a, q2_a, q3_a])

        p_pagong_text = (
            "Isang araw, namasyal si Pagong at si Matsing sa tabi ng ilog at nakakita sila ng isang puno ng saging na lumulutang sa tubig. "
            "Napagkasunduan nilang hatiin ang puno sa dalawa. Dahil tuso si Matsing, pinili niya ang itaas na bahagi na may mga "
            "luntiang dahon, sa pag-aakalang mabilis itong magbubunga. Ang ibabang bahagi naman na may mga ugat ang napunta sa "
            "matiyagang si Pagong. Itinanim ng dalawa ang kanilang bahagi sa lupa. Makalipas ang ilang linggo, nalanta ang bahagi "
            "ni Matsing, samantalang ang kay Pagong ay lumago at nagbunga ng matatamis na saging. Dito natutunan ni Matsing na "
            "ang kasakiman ay walang mabuting ibubunga kung ihahambing sa tiyaga."
        )

        p_pagong = Passage(
            id=uuid.uuid4(),
            teacher_id=t_marie.id,
            title='Si Pagong at si Matsing',
            source_type='typed',
            source_language='tl',
            raw_extracted_text=p_pagong_text,
            confirmed_text=p_pagong_text,
            word_count=len(p_pagong_text.split()),
            is_published=True,
            created_at=now - timedelta(days=3),
        )
        session.add(p_pagong)
        await session.flush()

        t_pagong = ComprehensionTest(
            id=uuid.uuid4(),
            passage_id=p_pagong.id,
            generated_by_model='gemma3:4b',
            created_at=now - timedelta(days=3),
        )
        session.add(t_pagong)
        await session.flush()

        q1_pg = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_pagong.id,
            question_text="Aling bahagi ng puno ng saging ang nakuha ni Matsing?",
            question_type='recall',
            choices=json.dumps(['Ang ibabang bahagi na may ugat', 'Ang itaas na bahagi na may mga dahon', 'Ang ugat lamang', 'Ang balat ng puno']),
            correct_choice_index=1,
            order_index=0,
        )
        q2_pg = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_pagong.id,
            question_text="Bakit nalanta ang bahagi ng puno na itinanim ni Matsing?",
            question_type='inference',
            choices=json.dumps([
                'Dahil walang ugat na sumisipsip ng sustansya mula sa lupa',
                'Dahil binunot ni Pagong sa gabi',
                'Dahil nilunod ng baha',
                'Dahil kinain ng mga ibon'
            ]),
            correct_choice_index=0,
            order_index=1,
        )
        q3_pg = ComprehensionQuestion(
            id=uuid.uuid4(),
            test_id=t_pagong.id,
            question_text="Paano magagamit ng mag-aaral ang aral ng kuwento sa kanyang paghahanda sa pagsusulit?",
            question_type='application',
            choices=json.dumps([
                'Umasa sa pangongopya sa katabi',
                'Magtiyagang magbalik-aral at magbasa araw-araw para sa tunay na pagkatuto',
                'Mag-aral lamang limang minuto bago ang eksamen',
                'Ipagpaliban ang takdang-aralin'
            ]),
            correct_choice_index=1,
            order_index=2,
        )
        session.add_all([q1_pg, q2_pg, q3_pg])

        # 5. Sessions for Juan Delata
        ses1_j = ReadingSession(
            id=uuid.uuid4(),
            student_id=s_juan.id,
            passage_id=p_mayon.id,
            passage_preview='The Legend of Mount Mayon (Oral Practice #1)',
            source_language='en',
            started_at=now - timedelta(days=4, hours=2),
            finished_reading_at=now - timedelta(days=4, hours=1, minutes=50),
            word_recognition_score=94.5,
            comprehension_score=75.0,
            phil_iri_level='instructional',
            guidance_message='Good initial reading cadence. Practice multi-syllabic adjectives like majestic and fertile.',
            completed_at=now - timedelta(days=4, hours=1, minutes=45),
            created_at=now - timedelta(days=4, hours=2),
        )
        ses2_j = ReadingSession(
            id=uuid.uuid4(),
            student_id=s_juan.id,
            passage_id=p_pinya.id,
            passage_preview='Ang Alamat ng Pinya (Oral Practice #2)',
            source_language='tl',
            started_at=now - timedelta(days=2, hours=3),
            finished_reading_at=now - timedelta(days=2, hours=2, minutes=50),
            word_recognition_score=96.0,
            comprehension_score=80.0,
            phil_iri_level='instructional',
            guidance_message='Mahusay na pagbasa sa Filipino. Tiyakin ang tamang diin sa mga salitang malubha at kusa.',
            completed_at=now - timedelta(days=2, hours=2, minutes=45),
            created_at=now - timedelta(days=2, hours=3),
        )
        ses3_j = ReadingSession(
            id=uuid.uuid4(),
            student_id=s_juan.id,
            passage_id=p_mayon.id,
            passage_preview='The Legend of Mount Mayon (Diagnostic Assessment)',
            source_language='en',
            started_at=now - timedelta(days=1, hours=1),
            finished_reading_at=now - timedelta(days=1, minutes=50),
            word_recognition_score=98.0,
            comprehension_score=90.0,
            phil_iri_level='independent',
            guidance_message='Outstanding mastery! Advanced from Instructional to Independent tier with excellent comprehension.',
            completed_at=now - timedelta(days=1, minutes=45),
            created_at=now - timedelta(days=1, hours=1),
        )
        session.add_all([ses1_j, ses2_j, ses3_j])

        # 6. Sessions for Darriel Dave Abad
        ses1_d = ReadingSession(
            id=uuid.uuid4(),
            student_id=s_darriel.id,
            passage_id=p_agusan.id,
            passage_preview='The Agusan Marsh Wildlife Sanctuary (Session #1)',
            source_language='en',
            started_at=now - timedelta(days=5, hours=3),
            finished_reading_at=now - timedelta(days=5, hours=2, minutes=50),
            word_recognition_score=91.0,
            comprehension_score=66.7,
            phil_iri_level='instructional',
            guidance_message='Strong effort on local ecological terminology. Work on cadence when encountering long compound sentences.',
            completed_at=now - timedelta(days=5, hours=2, minutes=45),
            created_at=now - timedelta(days=5, hours=3),
        )
        ses2_d = ReadingSession(
            id=uuid.uuid4(),
            student_id=s_darriel.id,
            passage_id=p_pagong.id,
            passage_preview='Si Pagong at si Matsing (Session #2)',
            source_language='tl',
            started_at=now - timedelta(days=3, hours=2),
            finished_reading_at=now - timedelta(days=3, hours=1, minutes=50),
            word_recognition_score=93.5,
            comprehension_score=75.0,
            phil_iri_level='instructional',
            guidance_message='Magandang tono ng pagbasa sa kuwentong-bayan. Patuloy na sanayin ang paghihinuha sa aral ng pabula.',
            completed_at=now - timedelta(days=3, hours=1, minutes=45),
            created_at=now - timedelta(days=3, hours=2),
        )
        ses3_d = ReadingSession(
            id=uuid.uuid4(),
            student_id=s_darriel.id,
            passage_id=p_agusan.id,
            passage_preview='The Agusan Marsh Wildlife Sanctuary (Session #3)',
            source_language='en',
            started_at=now - timedelta(days=1, hours=2),
            finished_reading_at=now - timedelta(days=1, hours=1, minutes=50),
            word_recognition_score=95.5,
            comprehension_score=80.0,
            phil_iri_level='instructional',
            guidance_message='Substantial progress! Word recognition rose to 95.5%, demonstrating improved phonics and fluency.',
            completed_at=now - timedelta(days=1, hours=1, minutes=45),
            created_at=now - timedelta(days=1, hours=2),
        )
        session.add_all([ses1_d, ses2_d, ses3_d])

        # 7. Test Assignments
        # Jhon Mark assigned tests to Juan
        ta1_j = TestAssignment(
            id=uuid.uuid4(),
            passage_id=p_mayon.id,
            teacher_id=t_jhon.id,
            student_id=s_juan.id,
            status='graded',
            word_recognition_score=98.0,
            comprehension_score=90.0,
            phil_iri_level='independent',
            teacher_remarks='Superb oral reading cadence and clear expression. Demonstrated full mastery on inference questions.',
            assigned_at=now - timedelta(days=3),
            completed_at=now - timedelta(days=1, hours=1),
            graded_at=now - timedelta(days=1),
        )
        ta2_j = TestAssignment(
            id=uuid.uuid4(),
            passage_id=p_pinya.id,
            teacher_id=t_jhon.id,
            student_id=s_juan.id,
            status='pending',
            assigned_at=now - timedelta(hours=6),
        )
        session.add_all([ta1_j, ta2_j])

        # Marie Santos assigned tests to Darriel
        ta1_d = TestAssignment(
            id=uuid.uuid4(),
            passage_id=p_agusan.id,
            teacher_id=t_marie.id,
            student_id=s_darriel.id,
            status='graded',
            word_recognition_score=95.5,
            comprehension_score=80.0,
            phil_iri_level='instructional',
            teacher_remarks='Noticeable fluency enhancement on technical wetland vocabulary. Well done on understanding the conservation application.',
            assigned_at=now - timedelta(days=4),
            completed_at=now - timedelta(days=1, hours=2),
            graded_at=now - timedelta(days=1),
        )
        ta2_d = TestAssignment(
            id=uuid.uuid4(),
            passage_id=p_pagong.id,
            teacher_id=t_marie.id,
            student_id=s_darriel.id,
            status='pending',
            assigned_at=now - timedelta(hours=8),
        )
        session.add_all([ta1_d, ta2_d])

        await session.commit()
        print("Database successfully seeded with realistic classes, passages, tests, reading sessions, and graded assignments!")

if __name__ == "__main__":
    asyncio.run(seed_realistic_data())
