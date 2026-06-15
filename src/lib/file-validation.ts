export const MAX_TIMESHEET_IMAGE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_TIMESHEET_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const ACCEPTED_TIMESHEET_IMAGE_EXTENSIONS = /\.(jpe?g|png)$/i;

export interface TimesheetImageCandidate {
  name: string;
  type: string;
  size: number;
}

export interface TimesheetImageValidationResult {
  ok: boolean;
  error?: string;
}

export function validateTimesheetImageFile(file: TimesheetImageCandidate): TimesheetImageValidationResult {
  if (!ACCEPTED_TIMESHEET_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: 'Please upload a JPG or PNG timesheet image.' };
  }

  if (!ACCEPTED_TIMESHEET_IMAGE_EXTENSIONS.test(file.name)) {
    return { ok: false, error: 'Timesheet images must use a .jpg, .jpeg, or .png extension.' };
  }

  if (file.size <= 0) {
    return { ok: false, error: 'The selected image is empty. Please choose another file.' };
  }

  if (file.size > MAX_TIMESHEET_IMAGE_BYTES) {
    return { ok: false, error: 'Please upload an image smaller than 10 MB.' };
  }

  return { ok: true };
}
