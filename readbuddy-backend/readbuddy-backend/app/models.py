import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Float, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    school_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="teacher")
    admin_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    students: Mapped[list["Student"]] = relationship(back_populates="teacher")
    passages: Mapped[list["Passage"]] = relationship(back_populates="teacher")
    classes: Mapped[list["Class"]] = relationship(back_populates="teacher")
    test_assignments: Mapped[list["TestAssignment"]] = relationship(back_populates="teacher")


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)  # e.g. "Section St. Jude"
    grade_level: Mapped[int] = mapped_column(Integer, default=7)  # Dedicated grade level (1-12)
    class_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # e.g. "SMCC-G7-STJUDE"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["Teacher"] = relationship(back_populates="classes")
    students: Mapped[list["Student"]] = relationship(back_populates="student_class")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    school_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="student")
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)
    section_name: Mapped[str | None] = mapped_column(String, nullable=True)
    grade_level: Mapped[int] = mapped_column(Integer, default=7)
    preferred_language: Mapped[str] = mapped_column(String, default="en")
    password_reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["Teacher | None"] = relationship(back_populates="students")
    student_class: Mapped["Class | None"] = relationship(back_populates="students")
    reading_sessions: Mapped[list["ReadingSession"]] = relationship(back_populates="student")
    test_assignments: Mapped[list["TestAssignment"]] = relationship(back_populates="student")


class Passage(Base):
    __tablename__ = "passages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    student_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    source_type: Mapped[str] = mapped_column(String, default="typed")  # "typed" | "photo_ocr" | "document_upload"
    source_language: Mapped[str] = mapped_column(String, default="en")  # "en" | "tl"
    raw_extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_text: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["Teacher | None"] = relationship(back_populates="passages")
    comprehension_tests: Mapped[list["ComprehensionTest"]] = relationship(back_populates="passage")
    reading_sessions: Mapped[list["ReadingSession"]] = relationship(back_populates="passage")
    test_assignments: Mapped[list["TestAssignment"]] = relationship(back_populates="passage")


class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    passage_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("passages.id"), nullable=True)
    passage_preview: Mapped[str | None] = mapped_column(String, nullable=True)
    source_language: Mapped[str] = mapped_column(String, default="en")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_reading_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    word_recognition_score: Mapped[float] = mapped_column(Float, default=0.0)
    comprehension_score: Mapped[float] = mapped_column(Float, default=0.0)
    phil_iri_level: Mapped[str] = mapped_column(String, default="instructional")  # "independent" | "instructional" | "frustration"
    guidance_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student: Mapped["Student"] = relationship(back_populates="reading_sessions")
    passage: Mapped["Passage | None"] = relationship(back_populates="reading_sessions")
    miscue_tokens: Mapped[list["MiscueToken"]] = relationship(back_populates="reading_session", cascade="all, delete-orphan")
    comprehension_answers: Mapped[list["ComprehensionAnswer"]] = relationship(back_populates="reading_session", cascade="all, delete-orphan")


class MiscueToken(Base):
    __tablename__ = "miscue_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reading_session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reading_sessions.id", ondelete="CASCADE"), nullable=False)
    word_index: Mapped[int] = mapped_column(Integer, nullable=False)
    expected_word: Mapped[str] = mapped_column(String, nullable=False)
    asr_transcribed_word: Mapped[str | None] = mapped_column(String, nullable=True)
    asr_model_used: Mapped[str] = mapped_column(String, default="facebook/mms-1b-all")
    is_correct: Mapped[bool] = mapped_column(Boolean, default=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    reading_session: Mapped["ReadingSession"] = relationship(back_populates="miscue_tokens")


class ComprehensionTest(Base):
    __tablename__ = "comprehension_tests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    passage_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("passages.id"), nullable=True)
    reading_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("reading_sessions.id"), nullable=True)
    generated_by_model: Mapped[str] = mapped_column(String, default="gemma3:4b")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    passage: Mapped["Passage | None"] = relationship(back_populates="comprehension_tests")
    questions: Mapped[list["ComprehensionQuestion"]] = relationship(back_populates="test", cascade="all, delete-orphan")


class ComprehensionQuestion(Base):
    __tablename__ = "comprehension_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("comprehension_tests.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String, nullable=False)  # "recall" | "inference" | "application"
    choices: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string array of 4 multiple-choice options
    correct_choice_index: Mapped[int] = mapped_column(Integer, default=0)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    test: Mapped["ComprehensionTest"] = relationship(back_populates="questions")
    answers: Mapped[list["ComprehensionAnswer"]] = relationship(back_populates="question")


class ComprehensionAnswer(Base):
    __tablename__ = "comprehension_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reading_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("reading_sessions.id", ondelete="CASCADE"), nullable=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("comprehension_questions.id"), nullable=False)
    selected_choice_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    reading_session: Mapped["ReadingSession | None"] = relationship(back_populates="comprehension_answers")
    question: Mapped["ComprehensionQuestion"] = relationship(back_populates="answers")


class TestAssignment(Base):
    __tablename__ = "test_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    passage_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("passages.id"), nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")  # "pending" | "completed" | "graded"
    word_recognition_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    comprehension_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    phil_iri_level: Mapped[str | None] = mapped_column(String, nullable=True)
    teacher_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    passage: Mapped["Passage"] = relationship(back_populates="test_assignments")
    teacher: Mapped["Teacher"] = relationship(back_populates="test_assignments")
    student: Mapped["Student"] = relationship(back_populates="test_assignments")


class AdminSettings(Base):
    __tablename__ = "admin_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default="default")
    asr_device: Mapped[str] = mapped_column(String, default="cuda")
    vram_budget_mb: Mapped[int] = mapped_column(Integer, default=8192)
    active_asr_model: Mapped[str] = mapped_column(String, default="facebook/mms-1b-all")
    active_llm_model: Mapped[str] = mapped_column(String, default="gemma3:4b")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))