import React, { useState } from 'react';
import apiClient from '../services/api';
import { Upload, CheckCircle2, AlertTriangle, FileText, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

const HEADER_ALIASES = {
  student_name: ['student_name', 'student name', 'name', 'full_name', 'fullname', 'student', 'candidate_name', 'candidate'],
  phone: ['phone', 'phone_number', 'phone number', 'mobile', 'mobile_number', 'mobile number', 'contact', 'contact_number', 'contact number', 'cell', 'phone_no', 'phoneno'],
  email: ['email', 'email_address', 'email address', 'mail'],
  degree: ['degree', 'qualification', 'course', 'education'],
  year: ['year', 'study_year', 'study year', 'academic_year', 'academic year'],
  branch: ['branch', 'department', 'specialization', 'stream'],
  career_goal: ['career_goal', 'career goal', 'goal', 'career'],
  interest: ['interest', 'interests', 'area_of_interest', 'area of interest', 'target_course', 'course_interest'],
  language: ['language', 'preferred_language', 'preferred language']
};

function normalizePhone(rawPhone) {
  if (rawPhone === undefined || rawPhone === null) return null;
  const s = String(rawPhone).trim();
  if (!s) return null;

  const cleaned = s.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+91')) {
    const digits = cleaned.slice(3);
    if (digits.length === 10 && /^\d+$/.test(digits)) return `+91${digits}`;
  } else if (cleaned.startsWith('91') && cleaned.length === 12 && /^\d+$/.test(cleaned)) {
    return `+91${cleaned.slice(2)}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 11 && /^\d+$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  } else if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    return `+91${cleaned}`;
  } else if (cleaned.startsWith('+') && cleaned.length >= 9 && cleaned.length <= 16 && /^\d+$/.test(cleaned.slice(1))) {
    return cleaned;
  }
  return null;
}

export default function ImportWizard({ isOpen, onClose, onImportComplete }) {
  const [step, setStep] = useState(1);
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({
    student_name: '',
    phone: '',
    email: '',
    degree: '',
    year: '',
    branch: '',
    career_goal: '',
    interest: '',
    language: ''
  });
  const [validationResult, setValidationResult] = useState({
    valid: [],
    invalid: 0,
    duplicates: 0,
    errors: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep(1);
    setCsvContent('');
    setFileName('');
    setParsedHeaders([]);
    setRawRows([]);
    setMapping({
      student_name: '',
      phone: '',
      email: '',
      degree: '',
      year: '',
      branch: '',
      career_goal: '',
      interest: '',
      language: ''
    });
    setValidationResult({ valid: [], invalid: 0, duplicates: 0, errors: [] });
    setImportSummary(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Handle File Upload & Parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    console.log('[CSV IMPORT] File:', file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvContent(text);

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length > 0) {
        // Parse CSV headers cleanly
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        console.log('[CSV IMPORT] Headers:', headers);
        setParsedHeaders(headers);

        const rows = lines.slice(1).map(l => l.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
        console.log('[CSV IMPORT] Parsed rows:', rows.length);
        setRawRows(rows);

        // Auto-map columns using alias definitions
        const autoMap = {
          student_name: '',
          phone: '',
          email: '',
          degree: '',
          year: '',
          branch: '',
          career_goal: '',
          interest: '',
          language: ''
        };

        headers.forEach((h) => {
          const lower = h.trim().toLowerCase().replace(/[- ]/g, '_');
          for (const [stdKey, aliases] of Object.entries(HEADER_ALIASES)) {
            if (!autoMap[stdKey] && aliases.map(a => a.replace(/ /g, '_')).includes(lower)) {
              autoMap[stdKey] = h;
            }
          }
        });

        // Fallbacks if not auto-matched
        if (!autoMap.student_name && headers.length > 0) autoMap.student_name = headers[0];
        if (!autoMap.phone && headers.length > 1) autoMap.phone = headers[1];

        console.log('[CSV IMPORT] Auto-mapping determined:', autoMap);
        setMapping(autoMap);
      }
    };
    reader.readAsText(file);
  };

  // Run validation step
  const handleRunValidation = () => {
    console.log('[CSV IMPORT] Mapping:', mapping);

    const getIdx = (colName) => colName ? parsedHeaders.indexOf(colName) : -1;

    const nameIdx = getIdx(mapping.student_name);
    const phoneIdx = getIdx(mapping.phone);
    const emailIdx = getIdx(mapping.email);
    const degreeIdx = getIdx(mapping.degree);
    const yearIdx = getIdx(mapping.year);
    const branchIdx = getIdx(mapping.branch);
    const goalIdx = getIdx(mapping.career_goal);
    const interestIdx = getIdx(mapping.interest);
    const langIdx = getIdx(mapping.language);

    const validList = [];
    const validationErrors = [];
    let invalidCount = 0;
    let dupCount = 0;
    const seenPhones = new Set();

    rawRows.forEach((row, rIdx) => {
      const rowNum = rIdx + 2; // header is row 1
      const student_name = nameIdx !== -1 ? (row[nameIdx] || '').trim() : '';
      const rawPhone = phoneIdx !== -1 ? (row[phoneIdx] || '').trim() : '';

      if (!student_name) {
        invalidCount++;
        validationErrors.push(`Row ${rowNum}: missing required field 'student_name'`);
        return;
      }

      if (!rawPhone) {
        invalidCount++;
        validationErrors.push(`Row ${rowNum} (${student_name}): missing required field 'phone'`);
        return;
      }

      const normPhone = normalizePhone(rawPhone);
      if (!normPhone) {
        invalidCount++;
        validationErrors.push(`Row ${rowNum} (${student_name}): invalid phone number '${rawPhone}'`);
        return;
      }

      if (seenPhones.has(normPhone)) {
        dupCount++;
        validationErrors.push(`Row ${rowNum} (${student_name}): duplicate phone '${normPhone}' inside CSV`);
        return;
      }
      seenPhones.add(normPhone);

      validList.push({
        student_name,
        phone: normPhone,
        email: emailIdx !== -1 ? row[emailIdx] : '',
        degree: degreeIdx !== -1 ? row[degreeIdx] : 'B.Tech',
        year: yearIdx !== -1 ? row[yearIdx] : '3rd Year',
        branch: branchIdx !== -1 ? row[branchIdx] : 'CSE',
        career_goal: goalIdx !== -1 ? row[goalIdx] : 'Software Engineer',
        interest: interestIdx !== -1 ? row[interestIdx] : 'Data Science & AI',
        language: langIdx !== -1 ? row[langIdx] : 'english'
      });
    });

    console.log('[CSV IMPORT] Validation result:', {
      validCount: validList.length,
      invalidCount,
      dupCount,
      errorsCount: validationErrors.length
    });

    setValidationResult({
      valid: validList,
      invalid: invalidCount,
      duplicates: dupCount,
      errors: validationErrors
    });
    setStep(4);
  };

  // Submit to Backend
  const handleFinalImport = async () => {
    setIsSubmitting(true);
    console.log('[CSV IMPORT] Payload:', { leads: validationResult.valid });

    try {
      const res = await apiClient.post('/leads/import-bulk', { leads: validationResult.valid });
      console.log('[CSV IMPORT] API response:', res);

      const summaryData = {
        ...res,
        // Combine client-side validation errors with backend duplicate/error messages if needed
        client_invalid: validationResult.invalid,
        client_duplicates: validationResult.duplicates,
        combined_errors: [
          ...(validationResult.errors || []),
          ...(res.errors || [])
        ]
      };

      setImportSummary(summaryData);
      setStep(5);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error('[CSV IMPORT] API Error:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Unknown import error';
      alert('Import failed: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Import Candidate Leads (CSV Wizard)</h3>
          <button onClick={handleClose} style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        {/* Wizard Steps Pills */}
        <div className="wizard-steps" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <div className={`step-pill ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>1. Upload</div>
          <div className={`step-pill ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>2. Preview</div>
          <div className={`step-pill ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>3. Mapping</div>
          <div className={`step-pill ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}>4. Validate</div>
          <div className={`step-pill ${step === 5 ? 'active' : ''}`}>5. Result</div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '28px', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', background: '#FAF9F6' }}>
            <Upload size={40} style={{ color: 'var(--gold-dark)', margin: '0 auto' }} />
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Select Lead CSV File to Upload</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                Supports columns like student_name, phone, email, degree, year, branch, career_goal, interest.
              </p>
            </div>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ margin: '0 auto' }} />
            {fileName && (
              <button className="btn btn-gold" style={{ marginTop: '12px', margin: '12px auto 0' }} onClick={() => setStep(2)}>
                <span>Continue to Preview ({rawRows.length} rows detected)</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>CSV Raw Content Preview ({rawRows.length} Rows)</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>File: {fileName}</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '220px', background: '#FAF8F3', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#ECE6D8' }}>
                    {parsedHeaders.map((h, idx) => <th key={idx} style={{ padding: '8px', borderBottom: '1px solid #DDD', textAlign: 'left' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #EEE' }}>
                      {row.map((cell, cIdx) => <td key={cIdx} style={{ padding: '8px' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-gold" onClick={() => setStep(3)}>Next: Column Mapping <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {/* STEP 3: MAPPING */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Column Mapping</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Map CSV headers to lead fields. <strong>Student Name</strong> and <strong>Phone Number</strong> are required.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Student Name *</label>
                <select value={mapping.student_name} onChange={e => setMapping({ ...mapping, student_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Phone Number *</label>
                <select value={mapping.phone} onChange={e => setMapping({ ...mapping, phone: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Email</label>
                <select value={mapping.email} onChange={e => setMapping({ ...mapping, email: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Degree / Education</label>
                <select value={mapping.degree} onChange={e => setMapping({ ...mapping, degree: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Academic Year</label>
                <select value={mapping.year} onChange={e => setMapping({ ...mapping, year: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Branch / Dept</label>
                <select value={mapping.branch} onChange={e => setMapping({ ...mapping, branch: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Career Goal</label>
                <select value={mapping.career_goal} onChange={e => setMapping({ ...mapping, career_goal: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Area of Interest</label>
                <select value={mapping.interest} onChange={e => setMapping({ ...mapping, interest: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CCC' }}>
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-gold" onClick={handleRunValidation}>Validate Records <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {/* STEP 4: VALIDATION */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Pre-Import Validation Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ background: '#EAF7EE', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #C3E6CB' }}>
                <span style={{ color: '#1E7E34', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Valid Candidates</span>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1E7E34', marginTop: '4px' }}>{validationResult.valid.length}</h3>
              </div>
              <div style={{ background: '#FFF8E6', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #FEEBC8' }}>
                <span style={{ color: '#B7791F', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Duplicates (File)</span>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#B7791F', marginTop: '4px' }}>{validationResult.duplicates}</h3>
              </div>
              <div style={{ background: '#FDE8E8', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #F8B4B4' }}>
                <span style={{ color: '#9B2C2C', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Invalid Rows</span>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#9B2C2C', marginTop: '4px' }}>{validationResult.invalid}</h3>
              </div>
            </div>

            {validationResult.errors && validationResult.errors.length > 0 && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '6px', padding: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#C53030', marginBottom: '6px' }}>Validation Warnings / Errors:</h5>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#9B2C2C' }}>
                  {validationResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-gold" onClick={handleFinalImport} disabled={isSubmitting || validationResult.valid.length === 0}>
                {isSubmitting ? 'Processing Import...' : `Import ${validationResult.valid.length} Valid Leads`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: RESULT */}
        {step === 5 && importSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '12px 20px 20px' }}>
            {importSummary.imported > 0 ? (
              <CheckCircle2 size={52} style={{ color: '#28A745', margin: '0 auto' }} />
            ) : (
              <AlertTriangle size={52} style={{ color: '#E53E3E', margin: '0 auto' }} />
            )}

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                {importSummary.imported > 0
                  ? 'Leads Successfully Imported!'
                  : 'Import Completed — No New Leads Added'}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {importSummary.message}
              </p>
            </div>

            {/* Results Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ background: '#EAF7EE', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #C3E6CB' }}>
                <span style={{ color: '#1E7E34', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Imported</span>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1E7E34', marginTop: '2px' }}>{importSummary.imported}</h3>
              </div>
              <div style={{ background: '#FFF8E6', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #FEEBC8' }}>
                <span style={{ color: '#B7791F', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Duplicates Skipped</span>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#B7791F', marginTop: '2px' }}>{importSummary.duplicates}</h3>
              </div>
              <div style={{ background: '#FDE8E8', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #F8B4B4' }}>
                <span style={{ color: '#9B2C2C', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Invalid Rows</span>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#9B2C2C', marginTop: '2px' }}>{importSummary.invalid}</h3>
              </div>
            </div>

            {/* Error Detail Breakdown */}
            {importSummary.combined_errors && importSummary.combined_errors.length > 0 && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '6px', padding: '12px', textAlign: 'left', maxHeight: '140px', overflowY: 'auto' }}>
                <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#C53030', marginBottom: '6px' }}>Detailed Log Messages:</h5>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#9B2C2C' }}>
                  {importSummary.combined_errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className="btn btn-gold" style={{ margin: '12px auto 0', padding: '10px 24px' }} onClick={handleClose}>
              Done & Refresh Leads
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
