import asyncio
import json
from sqlalchemy import select
from app.db import engine, Base, async_session_maker
from app.models import Teacher, Student, Class, Passage, ComprehensionTest, ComprehensionQuestion
from app.auth.security import hash_password


async def init_database():
    print("[DB Init] Creating database tables in PostgreSQL...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[DB Init] Tables created successfully.")

    async with async_session_maker() as session:
        # Check if default teacher exists
        existing_teacher = await session.scalar(select(Teacher).where(Teacher.school_id == "SMCC-2024-001"))
        if existing_teacher:
            print("[DB Init] Database already contains seed data.")
            return

        print("[DB Init] Seeding initial SMCC school records...")

        # 1. Create Teacher
        teacher = Teacher(
            display_name="Prof. Maria Santos",
            school_id="SMCC-2024-001",
            email="teacher@smcc.edu.ph",
            password_hash=hash_password("TeacherPass123!"),
            email_verified=True,
        )
        session.add(teacher)
        await session.flush()

        # 2. Create Classes / Sections
        class_g7 = Class(
            teacher_id=teacher.id,
            name="Section St. Jude",
            grade_level=7,
            class_code="SMCC-G7-STJUDE",
        )
        class_g3 = Class(
            teacher_id=teacher.id,
            name="Section St. Mark",
            grade_level=3,
            class_code="SMCC-G3-STMARK",
        )
        class_g10 = Class(
            teacher_id=teacher.id,
            name="Section St. Luke",
            grade_level=10,
            class_code="SMCC-G10-STLUK",
        )
        session.add_all([class_g7, class_g3, class_g10])
        await session.flush()

        # 3. Create Students
        student_juan = Student(
            display_name="Juan dela Cruz",
            username="juan_delacruz",
            email="juan@student.smcc.edu.ph",
            password_hash=hash_password("Student123!"),
            teacher_id=teacher.id,
            class_id=class_g7.id,
            grade_level=7,
            preferred_language="en",
        )
        student_ana = Student(
            display_name="Ana Reyes",
            username="ana_reyes",
            email="ana@student.smcc.edu.ph",
            password_hash=hash_password("Student123!"),
            teacher_id=teacher.id,
            class_id=class_g3.id,
            grade_level=3,
            preferred_language="en",
        )
        session.add_all([student_juan, student_ana])
        await session.flush()

        # 4. Create Sample Reading Passage
        passage_text = (
            "The Philippine Eagle is one of the largest and most powerful birds in the world. "
            "It is endemic to the tropical rainforests of the Philippines. "
            "Also known as the monkey-eating eagle, it has brown and white plumage and a shag-like crest. "
            "Efforts are underway across basic education institutions to protect its natural habitat."
        )
        passage = Passage(
            teacher_id=teacher.id,
            source_type="typed",
            source_language="en",
            confirmed_text=passage_text,
            word_count=len(passage_text.split()),
            is_published=True,
        )
        session.add(passage)
        await session.flush()

        # 5. Create Comprehension Test & Questions
        comp_test = ComprehensionTest(
            passage_id=passage.id,
            generated_by_model="gemma3:4b",
        )
        session.add(comp_test)
        await session.flush()

        q1 = ComprehensionQuestion(
            test_id=comp_test.id,
            question_text="Where is the Philippine Eagle endemic to?",
            question_type="recall",
            choices=json.dumps([
                "Tropical rainforests of the Philippines",
                "Deserts of Australia",
                "Mountains of Japan",
                "Savannas of Africa"
            ]),
            correct_choice_index=0,
            order_index=0,
        )
        q2 = ComprehensionQuestion(
            test_id=comp_test.id,
            question_text="What can be inferred about the conservation status of the Philippine Eagle?",
            question_type="inference",
            choices=json.dumps([
                "It is plentiful everywhere",
                "It needs protected habitats to survive",
                "It migrates every winter",
                "It lives strictly in cities"
            ]),
            correct_choice_index=1,
            order_index=1,
        )
        q3 = ComprehensionQuestion(
            test_id=comp_test.id,
            question_text="If your school starts an environmental awareness project, how can you apply the lesson from this passage?",
            question_type="application",
            choices=json.dumps([
                "Promote forest preservation and wildlife habitat protection",
                "Keep wild eagles as household pets",
                "Disregard natural conservation guidelines",
                "Build highways through rainforest reserves"
            ]),
            correct_choice_index=0,
            order_index=2,
        )
        session.add_all([q1, q2, q3])
        await session.commit()

        print("[DB Init] PostgreSQL Database seeded with real data:")
        print("  - Teacher: Prof. Maria Santos (SMCC-2024-001 / teacher@smcc.edu.ph)")
        print("  - Sections: Grade 7 St. Jude, Grade 3 St. Mark, Grade 10 St. Luke")
        print("  - Students: @juan_delacruz, @ana_reyes")


if __name__ == "__main__":
    asyncio.run(init_database())
