import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    school_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    students: Mapped[list["Student"]] = relationship(back_populates="teacher")
    passages: Mapped[list["Passage"]] = relationship(back_populates="teacher")
    classes: Mapped[list["Class"]] = relationship(back_populates="teacher")


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("teachers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)  # e.g. "Section St. Jude"
    grade_level: Mapped[int] = mapped_column(default=7)  # Dedicated grade level (0-12)
    class_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # e.g. "SMCC-G7-STJUDE"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["Teacher"] = relationship(back_populates="classes")
    students: Mapped[list["Student"]] = relationship(back_populates="student_class")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String, nullable=False)  # first name/nickname only, per Schema.md
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("teachers.id"), nullable=False)
    class_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("classes.id"), nullable=True)
    grade_level: Mapped[int] = mapped_column(default=0)
    preferred_language: Mapped[str] = mapped_column(String, default="en")
    password_reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["Teacher"] = relationship(back_populates="students")
    student_class: Mapped["Class | None"] = relationship(back_populates="students")



class Passage(Base):
    __tablename__ = "passages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("teachers.id"), nullable=True)
    student_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("students.id"), nullable=True)
    source_type: Mapped[str] = mapped_column(String, default="typed")
    source_language: Mapped[str] = mapped_column(String, default="en")
    raw_extracted_text: Mapped[str | None] = mapped_column(String, nullable=True)
    confirmed_text: Mapped[str] = mapped_column(String, nullable=False)
    word_count: Mapped[int] = mapped_column(default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["Teacher | None"] = relationship(back_populates="passages")
    comprehension_tests: Mapped[list["ComprehensionTest"]] = relationship(back_populates="passage")


class ComprehensionTest(Base):
    __tablename__ = "comprehension_tests"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    passage_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("passages.id"), nullable=True)
    generated_by_model: Mapped[str] = mapped_column(String, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    passage: Mapped["Passage | None"] = relationship(back_populates="comprehension_tests")
    questions: Mapped[list["ComprehensionQuestion"]] = relationship(back_populates="test")


class ComprehensionQuestion(Base):
    __tablename__ = "comprehension_questions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    test_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("comprehension_tests.id"), nullable=False)
    question_text: Mapped[str] = mapped_column(String, nullable=False)
    question_type: Mapped[str] = mapped_column(String, nullable=False)  # recall / inference / application
    choices: Mapped[str] = mapped_column(String, nullable=False)  # JSON string of 4 choice strings
    correct_choice_index: Mapped[int] = mapped_column(default=0)
    order_index: Mapped[int] = mapped_column(default=0)

    test: Mapped["ComprehensionTest"] = relationship(back_populates="questions")


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
