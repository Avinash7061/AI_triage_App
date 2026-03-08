"""
SQLAlchemy ORM Models — Users, Prescriptions, Appointments
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, JSON, Enum
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # patient, doctor, hospital_staff
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
        }


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), nullable=False, index=True)
    patient_name = Column(String(255), nullable=False)
    symptoms = Column(JSON, nullable=False)  # list of strings
    ai_suggestion = Column(Text, nullable=False)
    triage_category = Column(String(20), nullable=False)  # Red, Orange, Yellow, White
    verified = Column(Boolean, default=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    doctor_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "patientName": self.patient_name,
            "symptoms": self.symptoms or [],
            "aiSuggestion": self.ai_suggestion,
            "triageCategory": self.triage_category,
            "verified": self.verified,
            "status": self.status,
            "doctorNotes": self.doctor_notes,
            "timestamp": self.created_at.isoformat() if self.created_at else None,
        }


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), nullable=False, index=True)
    hospital_id = Column(String(50), nullable=False)
    department_name = Column(String(255), nullable=False)
    slot = Column(String(100), nullable=False)
    status = Column(String(20), default="booked")  # booked, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "hospitalId": self.hospital_id,
            "departmentName": self.department_name,
            "slot": self.slot,
            "status": self.status,
        }
