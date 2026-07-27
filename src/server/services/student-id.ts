// Pure student-ID validation (spec v2 §19.1). No side effects — Jest target.
export type StudentIdValidationResult =
  | "VALID"
  | "STUDENT_ID_REQUIRED"
  | "STUDENT_ID_MUST_BE_NUMERIC"
  | "STUDENT_ID_MUST_BE_10_DIGITS";

export function validateStudentId(
  studentId: string,
): StudentIdValidationResult {
  if (!studentId || studentId.trim() === "") {
    return "STUDENT_ID_REQUIRED";
  }
  if (!/^\d+$/.test(studentId)) {
    return "STUDENT_ID_MUST_BE_NUMERIC";
  }
  if (studentId.length !== 10) {
    return "STUDENT_ID_MUST_BE_10_DIGITS";
  }
  return "VALID";
}
