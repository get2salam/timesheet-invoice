import { describe, expect, it } from 'vitest';
import { MAX_TIMESHEET_IMAGE_BYTES, validateTimesheetImageFile } from '../src/lib/file-validation';

describe('validateTimesheetImageFile', () => {
  it('accepts JPG and PNG timesheet images within the OCR size limit', () => {
    expect(validateTimesheetImageFile({ name: 'shift.jpg', type: 'image/jpeg', size: 1024 })).toEqual({ ok: true });
    expect(validateTimesheetImageFile({ name: 'shift.png', type: 'image/png', size: MAX_TIMESHEET_IMAGE_BYTES })).toEqual({ ok: true });
  });

  it('rejects SVG even though browsers classify it as an image', () => {
    const result = validateTimesheetImageFile({ name: 'payload.svg', type: 'image/svg+xml', size: 512 });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('JPG or PNG');
  });

  it('rejects files whose extension does not match the allowed image formats', () => {
    const result = validateTimesheetImageFile({ name: 'payload.svg', type: 'image/png', size: 512 });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('.jpg, .jpeg, or .png');
  });

  it('rejects oversized images before they reach OCR processing', () => {
    const result = validateTimesheetImageFile({
      name: 'huge-timesheet.png',
      type: 'image/png',
      size: MAX_TIMESHEET_IMAGE_BYTES + 1,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  it('rejects empty files with a valid image MIME type', () => {
    const result = validateTimesheetImageFile({ name: 'empty.jpg', type: 'image/jpeg', size: 0 });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('empty');
  });
});
