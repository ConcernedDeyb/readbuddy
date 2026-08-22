from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Teacher, Student, Class
from app.auth.security import (
    hash_password, verify_password, generate_verification_token,
    create_session_token, get_current_user, require_role,
)
from app.auth.email import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])


class TeacherRegisterRequest(BaseModel):
    display_name: str
    school_id: str
    email: str
    password: str


class TeacherLoginRequest(BaseModel):
    school_id: str
    password: str


class StudentLoginRequest(BaseModel):
    username: str
    password: str


class CreateStudentRequest(BaseModel):
    display_name: str
    school_id: str
    username: str | None = None
    email: str | None = None
    password: str
    grade_level: int = 7
    section_name: str | None = None
    preferred_language: str = "en"


class ForgotPasswordRequest(BaseModel):
    identifier: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/teacher/register", status_code=status.HTTP_201_CREATED)
async def register_teacher(body: TeacherRegisterRequest, db: AsyncSession = Depends(get_db)):
    clean_id = body.school_id.strip()
    clean_email = body.email.strip().lower()
    clean_name = body.display_name.strip()

    existing = await db.scalar(
        select(Teacher).where(
            or_(Teacher.school_id == clean_id, Teacher.email == clean_email)
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="That school ID or email is already registered in the database.")

    teacher = Teacher(
        display_name=clean_name,
        school_id=clean_id,
        email=clean_email,
        password_hash=hash_password(body.password),
        admin_approved=True,
        email_verified=True,
    )
    db.add(teacher)
    await db.commit()

    return {
        "detail": "Teacher account created and recorded in database.",
        "school_id": teacher.school_id,
        "display_name": teacher.display_name,
        "email": teacher.email,
        "role": "teacher"
    }


@router.get("/teacher/verify")
async def verify_teacher_email(token: str, db: AsyncSession = Depends(get_db)):
    teacher = await db.scalar(select(Teacher).where(Teacher.email_verification_token == token))
    if not teacher:
        raise HTTPException(status_code=400, detail="Invalid or already-used verification link.")
    teacher.email_verified = True
    teacher.email_verification_token = None
    await db.commit()
    return {"detail": "Email verified. You can now log in."}


@router.post("/teacher/login")
async def login_teacher(body: TeacherLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    ident = body.school_id.strip().lower()
    teacher = await db.scalar(
        select(Teacher).where(
            or_(
                Teacher.school_id.ilike(ident),
                Teacher.email.ilike(ident)
            )
        )
    )
    if not teacher:
        # Check if this ID belongs to a student
        student = await db.scalar(
            select(Student).where(
                or_(
                    Student.school_id.ilike(ident),
                    Student.username.ilike(ident),
                    Student.email.ilike(ident)
                )
            )
        )
        if student:
            raise HTTPException(
                status_code=403,
                detail=f"Role Mismatch: School ID '{body.school_id}' is registered as a Student ({student.display_name}). Please switch to the STUDENT login tab above."
            )
        raise HTTPException(status_code=401, detail="No educator account found with that School ID or email.")

    if not verify_password(body.password, teacher.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify your password or use 'Forgot password?'.")

    token = create_session_token(user_id=str(teacher.id), role="teacher")
    response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7)
    return {
        "display_name": teacher.display_name,
        "school_id": teacher.school_id,
        "email": teacher.email,
        "role": "teacher"
    }


@router.post("/student/register", status_code=status.HTTP_201_CREATED)
async def register_student(body: CreateStudentRequest, db: AsyncSession = Depends(get_db)):
    clean_id = body.school_id.strip()
    clean_name = body.display_name.strip()
    formal_username = (body.username or clean_id).strip()
    clean_email = body.email.strip().lower() if body.email else f"{clean_id}@smccnasipit.edu.ph"

    # Check if student with that school_id, username, or email already exists
    existing = await db.scalar(
        select(Student).where(
            or_(
                Student.school_id == clean_id,
                Student.username == formal_username,
                Student.email == clean_email
            )
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="A student account with that School ID or username already exists.")

    # Find teacher or class if section name matches
    teacher_id = None
    class_id = None
    if body.section_name:
        matching_class = await db.scalar(select(Class).where(Class.name.ilike(body.section_name.strip())))
        if matching_class:
            class_id = matching_class.id
            teacher_id = matching_class.teacher_id

    student = Student(
        display_name=clean_name,
        school_id=clean_id,
        username=formal_username,
        email=clean_email,
        password_hash=hash_password(body.password),
        grade_level=body.grade_level,
        section_name=body.section_name,
        teacher_id=teacher_id,
        class_id=class_id,
        preferred_language=body.preferred_language,
    )
    db.add(student)
    await db.commit()

    return {
        "detail": "Student account created and recorded in database.",
        "school_id": student.school_id,
        "username": student.username,
        "display_name": student.display_name,
        "email": student.email,
        "grade_level": student.grade_level,
        "role": "student"
    }


@router.post("/student/login")
async def login_student(body: StudentLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    ident = body.username.strip().lower()
    student = await db.scalar(
        select(Student).where(
            or_(
                Student.school_id.ilike(ident),
                Student.username.ilike(ident),
                Student.email.ilike(ident)
            )
        )
    )
    if not student:
        # Check if this ID belongs to a teacher
        teacher = await db.scalar(
            select(Teacher).where(
                or_(
                    Teacher.school_id.ilike(ident),
                    Teacher.email.ilike(ident)
                )
            )
        )
        if teacher:
            raise HTTPException(
                status_code=403,
                detail=f"Role Mismatch: School ID '{body.username}' is registered as an Educator / Teacher ({teacher.display_name}). Please switch to the TEACHER login tab above."
            )
        raise HTTPException(status_code=401, detail="No student account found with that School ID or username.")

    if not verify_password(body.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify your password or use 'Forgot password?'.")

    token = create_session_token(user_id=str(student.id), role="student")
    response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7)
    return {
        "display_name": student.display_name,
        "school_id": student.school_id,
        "username": student.username,
        "email": student.email,
        "grade_level": student.grade_level,
        "section_name": student.section_name,
        "role": "student"
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session_token")
    return {"detail": "Logged out."}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    import random
    ident = body.identifier.strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Identifier is required.")

    code = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    # Check teacher
    teacher = await db.scalar(
        select(Teacher).where(
            or_(
                Teacher.school_id.ilike(ident),
                Teacher.email.ilike(ident)
            )
        )
    )
    if teacher:
        teacher.password_reset_token = code
        teacher.password_reset_expires_at = expires_at
        await db.commit()
        return {"detail": "Reset code generated.", "reset_token": code, "email": teacher.email}

    # Check student
    student = await db.scalar(
        select(Student).where(
            or_(
                Student.school_id.ilike(ident),
                Student.username.ilike(ident),
                Student.email.ilike(ident)
            )
        )
    )
    if student:
        student.password_reset_token = code
        student.password_reset_expires_at = expires_at
        await db.commit()
        return {"detail": "Reset code generated.", "reset_token": code, "email": student.email}

    # If not in database yet, return generated code for client-side demo verification
    return {"detail": "Reset code generated.", "reset_token": code, "email": ident if "@" in ident else f"{ident}@smccnasipit.edu.ph"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    teacher = await db.scalar(
        select(Teacher).where(
            Teacher.password_reset_token == body.token,
            Teacher.password_reset_expires_at > now
        )
    )
    if teacher:
        teacher.password_hash = hash_password(body.new_password)
        teacher.password_reset_token = None
        teacher.password_reset_expires_at = None
        await db.commit()
        return {"detail": "Teacher password updated successfully."}

    student = await db.scalar(
        select(Student).where(
            Student.password_reset_token == body.token,
            Student.password_reset_expires_at > now
        )
    )
    if student:
        student.password_hash = hash_password(body.new_password)
        student.password_reset_token = None
        student.password_reset_expires_at = None
        await db.commit()
        return {"detail": "Student password updated successfully."}

    return {"detail": "Password reset completed."}


class AssignSectionRequest(BaseModel):
    student_ids: list[str]
    section_name: str
    grade_level: int
    teacher_name: str | None = None


@router.post("/students/assign-section")
async def assign_students_section(body: AssignSectionRequest, db: AsyncSession = Depends(get_db)):
    matching_class = await db.scalar(select(Class).where(Class.name.ilike(body.section_name.strip())))
    class_id = matching_class.id if matching_class else None
    teacher_id = matching_class.teacher_id if matching_class else None

    count = 0
    for sid in body.student_ids:
        clean_sid = sid.strip()
        student = await db.scalar(
            select(Student).where(
                or_(
                    Student.school_id.ilike(clean_sid),
                    Student.username.ilike(clean_sid),
                )
            )
        )
        if student:
            student.section_name = body.section_name.strip()
            student.grade_level = body.grade_level
            if class_id:
                student.class_id = class_id
            if teacher_id:
                student.teacher_id = teacher_id
            count += 1
    await db.commit()
    return {"detail": f"Successfully updated section for {count} student(s).", "count": count}


class DeleteStudentRequest(BaseModel):
    student_id: str


@router.post("/students/delete")
async def delete_student_post(body: DeleteStudentRequest, db: AsyncSession = Depends(get_db)):
    clean_id = body.student_id.strip()
    student = await db.scalar(
        select(Student).where(
            or_(
                Student.school_id.ilike(clean_id),
                Student.username.ilike(clean_id),
            )
        )
    )
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{clean_id}' not found in database.")
    
    await db.delete(student)
    await db.commit()
    return {"detail": f"Student '{clean_id}' has been permanently deleted from the database."}


@router.delete("/students/{student_id}")
async def delete_student_by_id(student_id: str, db: AsyncSession = Depends(get_db)):
    clean_id = student_id.strip()
    student = await db.scalar(
        select(Student).where(
            or_(
                Student.school_id.ilike(clean_id),
                Student.username.ilike(clean_id),
            )
        )
    )
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{clean_id}' not found in database.")
    
    await db.delete(student)
    await db.commit()
    return {"detail": f"Student '{clean_id}' has been permanently deleted from the database."}


@router.post("/students/unassign")
async def unassign_students(body: DeleteStudentRequest, db: AsyncSession = Depends(get_db)):
    clean_id = body.student_id.strip()
    student = await db.scalar(
        select(Student).where(
            or_(
                Student.school_id.ilike(clean_id),
                Student.username.ilike(clean_id),
            )
        )
    )
    if student:
        student.section_name = "Unassigned"
        student.class_id = None
        student.teacher_id = None
        await db.commit()
        return {"detail": f"Student '{clean_id}' has been unassigned from all sections."}
    return {"detail": f"Student '{clean_id}' was not in database, unassigned locally."}


@router.get("/students")
async def list_all_students(grade: int | None = None, search: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Student)
    if grade is not None and grade > 0:
        query = query.where(Student.grade_level == grade)
    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                Student.display_name.ilike(s),
                Student.school_id.ilike(s),
                Student.username.ilike(s),
                Student.email.ilike(s),
                Student.section_name.ilike(s)
            )
        )
    query = query.order_by(Student.grade_level.asc(), Student.display_name.asc())
    result = await db.execute(query)
    students = result.scalars().all()

    return [
        {
            "id": str(st.id),
            "display_name": st.display_name,
            "school_id": st.school_id,
            "username": st.username,
            "email": st.email,
            "grade_level": st.grade_level,
            "section_name": st.section_name or "Unassigned",
            "preferred_language": st.preferred_language or "en",
            "created_at": st.created_at.isoformat() if st.created_at else None,
        }
        for st in students
    ]