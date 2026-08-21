from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Teacher, Student
from app.auth.security import (
    hash_password, verify_password, generate_verification_token,
    create_session_token, get_current_user, require_role,
)
from app.auth.email import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

WRONG_PORTAL_TEACHER = (
    "Teacher accounts cannot sign in through the Student portal. Switch to the Teacher tab."
)
WRONG_PORTAL_STUDENT = (
    "Student accounts cannot sign in through the Teacher portal. Switch to the Student tab."
)


class TeacherRegisterRequest(BaseModel):
    display_name: str
    school_id: str
    email: EmailStr
    password: str


class TeacherLoginRequest(BaseModel):
    school_id: str
    password: str


class StudentLoginRequest(BaseModel):
    username: str
    password: str


class CreateStudentRequest(BaseModel):
    display_name: str
    username: str
    password: str
    email: str | None = None
    grade_level: int = 0
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
    existing = await db.scalar(select(Teacher).where(Teacher.school_id == body.school_id))
    if existing:
        raise HTTPException(status_code=400, detail="That school ID is already registered.")

    token = generate_verification_token()
    teacher = Teacher(
        display_name=body.display_name,
        school_id=body.school_id,
        email=body.email,
        password_hash=hash_password(body.password),
        email_verification_token=token,
    )
    db.add(teacher)
    await db.commit()

    send_verification_email(body.email, token)
    return {"detail": "Account created. Check your email to verify before logging in."}


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
    ident = body.school_id.strip()
    teacher = await db.scalar(select(Teacher).where(or_(Teacher.school_id == ident, Teacher.email == ident)))
    if teacher:
        if not verify_password(body.password, teacher.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect school ID, email, or password.")
        if not teacher.email_verified:
            raise HTTPException(status_code=403, detail="Please verify your email before logging in.")

        token = create_session_token(user_id=str(teacher.id), role="teacher")
        response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7)
        return {"display_name": teacher.display_name, "role": "teacher"}

    student = await db.scalar(select(Student).where(or_(Student.username == ident, Student.email == ident)))
    if student:
        raise HTTPException(status_code=403, detail=WRONG_PORTAL_STUDENT)

    raise HTTPException(status_code=401, detail="Incorrect school ID, email, or password.")


@router.post("/student/register", status_code=status.HTTP_201_CREATED)
async def register_student(body: CreateStudentRequest, db: AsyncSession = Depends(get_db)):
    # Check if username or email already exists
    stmt = select(Student).where(or_(Student.username == body.username, Student.email == body.email if body.email else False))
    existing = await db.scalar(stmt)
    if existing:
        raise HTTPException(status_code=400, detail="A student account with that username or email already exists.")

    teacher = await db.scalar(select(Teacher).limit(1))
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher found in database to assign student.")

    student = Student(
        display_name=body.display_name,
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        teacher_id=teacher.id,
        grade_level=body.grade_level,
        preferred_language=body.preferred_language,
    )
    db.add(student)
    await db.commit()
    return {"detail": "Student account created successfully.", "username": student.username, "display_name": student.display_name}


@router.post("/student/login")
async def login_student(body: StudentLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    ident = body.username.strip()
    student = await db.scalar(select(Student).where(or_(Student.username == ident, Student.email == ident)))
    if student:
        if not verify_password(body.password, student.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect username, email, or password.")

        token = create_session_token(user_id=str(student.id), role="student")
        response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7)
        return {"display_name": student.display_name, "role": "student"}

    teacher = await db.scalar(select(Teacher).where(or_(Teacher.school_id == ident, Teacher.email == ident)))
    if teacher:
        raise HTTPException(status_code=403, detail=WRONG_PORTAL_TEACHER)

    raise HTTPException(status_code=401, detail="Incorrect username, email, or password.")


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session_token")
    return {"detail": "Logged out."}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    import random
    ident = body.identifier.strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Account identifier or registered email is required.")

    # Search teacher by school_id or email
    teacher = await db.scalar(select(Teacher).where(or_(Teacher.school_id == ident, Teacher.email == ident)))
    if teacher:
        token = str(random.randint(100000, 999999))
        teacher.password_reset_token = token
        teacher.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        send_password_reset_email(teacher.email, token)
        return {
            "detail": f"Verification code sent to {teacher.email}. Enter the 6-digit code to authenticate and reset password.",
            "reset_token": token,
            "email": teacher.email,
            "account_type": "teacher",
        }

    # Search student by username or email
    student = await db.scalar(select(Student).where(or_(Student.username == ident, Student.email == ident)))
    if student:
        token = str(random.randint(100000, 999999))
        student.password_reset_token = token
        student.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        target_email = student.email or f"{student.username}@student.smcc.edu.ph"
        if student.email:
            send_password_reset_email(student.email, token)
        return {
            "detail": f"Verification code sent to {target_email}. Enter the 6-digit code to authenticate and reset password.",
            "reset_token": token,
            "email": target_email,
            "account_type": "student",
        }

    raise HTTPException(status_code=404, detail="No registered account found matching that email, username, or school ID.")


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token = body.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Reset token is required.")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    now = datetime.now(timezone.utc)

    # Check teacher
    teacher = await db.scalar(select(Teacher).where(Teacher.password_reset_token == token))
    if teacher and teacher.password_reset_expires_at and teacher.password_reset_expires_at > now:
        teacher.password_hash = hash_password(body.new_password)
        teacher.password_reset_token = None
        teacher.password_reset_expires_at = None
        await db.commit()
        return {"detail": "Password reset successfully. You may now log in with your new password."}

    # Check student
    student = await db.scalar(select(Student).where(Student.password_reset_token == token))
    if student and student.password_reset_expires_at and student.password_reset_expires_at > now:
        student.password_hash = hash_password(body.new_password)
        student.password_reset_token = None
        student.password_reset_expires_at = None
        await db.commit()
        return {"detail": "Student password reset successfully. You may now log in with your new password."}

    raise HTTPException(status_code=400, detail="Invalid or expired reset token.")


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user_session: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    user_id = user_session.get("sub")
    role = user_session.get("role")

    if role == "teacher":
        teacher = await db.scalar(select(Teacher).where(Teacher.id == user_id))
        if not teacher or not verify_password(body.current_password, teacher.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        teacher.password_hash = hash_password(body.new_password)
        await db.commit()
        return {"detail": "Password updated successfully."}

    elif role == "student":
        student = await db.scalar(select(Student).where(Student.id == user_id))
        if not student or not verify_password(body.current_password, student.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        student.password_hash = hash_password(body.new_password)
        await db.commit()
        return {"detail": "Password updated successfully."}

    raise HTTPException(status_code=400, detail="Unknown user role.")


@router.post("/teacher/students", status_code=status.HTTP_201_CREATED)
async def create_student(
    body: CreateStudentRequest,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.scalar(select(Student).where(Student.username == body.username))
    if existing:
        raise HTTPException(status_code=400, detail="That username is already taken.")

    student = Student(
        display_name=body.display_name,
        username=body.username,
        password_hash=hash_password(body.password),
        teacher_id=teacher_session["sub"],
        grade_level=body.grade_level,
        preferred_language=body.preferred_language,
    )
    db.add(student)
    await db.commit()
    return {"id": str(student.id), "username": student.username}


@router.get("/teacher/students")
async def list_my_students(
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Student).where(Student.teacher_id == teacher_session["sub"]))
    students = result.scalars().all()
    return [{"id": str(s.id), "display_name": s.display_name, "username": s.username} for s in students]
