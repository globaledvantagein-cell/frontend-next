'use client';

/**
 * Displays the AI-parsed resume profile on the Profile page.
 * Shows summary, skills with categories, work experience with responsibilities
 * and tech tags, education, and projects — similar to JobMesh's profile view.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { FileText, Upload, Briefcase, GraduationCap, FolderOpen, Wrench, Pencil, X, Plus, Check } from 'lucide-react';
import { Card, Badge, Button, Alert } from '../ui';
import { apiGet, apiPatch } from '../../utils/jobApi';

interface ParsedProfile {
  name?: string;
  email?: string;
  summary?: string;
  experience?: { company: string; title: string; startDate: string | null; endDate: string | null; isCurrent: boolean; responsibilities: string[]; technologies: string[] }[];
  education?: { institution: string; degree: string; field: string; endDate: string | null }[];
  skills?: { name: string; category: string }[];
  projects?: { name: string; description: string; technologies: string[] }[];
  total_experience_years?: number | null;
  seniority_level?: string | null;
  domain?: string;
  sub_domain?: string | null;
  languages?: { language: string; proficiency: string }[];
  location?: string | null;
}

export default function ParsedResumeProfile() {
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ parsedProfile?: ParsedProfile }>('/api/auth/me')
      .then(data => setProfile(data?.parsedProfile || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 14 }} />;

  if (!profile) {
    // Compact, inviting empty state — the drop zone itself is the call to
    // action, so we don't repeat an icon + long blurb above it.
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <FileText size={15} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Your resume</h4>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Upload a PDF to build your profile and unlock job matching.
        </p>
        <ResumeUploader onParsed={(p) => setProfile(p)} />
      </Card>
    );
  }

  const skills = profile.skills || [];
  const experience = profile.experience || [];
  const education = profile.education || [];
  const projects = profile.projects || [];
  const languages = profile.languages || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header + Summary */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Parsed Resume</h3>
            {profile.name && <p style={{ margin: '2px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{profile.name}</p>}
          </div>
          <ResumeUploader compact onParsed={(p) => setProfile(p)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {profile.seniority_level && <Badge variant="primary">{profile.seniority_level}</Badge>}
          {profile.domain && <Badge variant="blue">{profile.domain}</Badge>}
          {profile.sub_domain && <Badge variant="neutral">{profile.sub_domain}</Badge>}
          {profile.total_experience_years != null && <Badge variant="neutral">{profile.total_experience_years} yr{profile.total_experience_years !== 1 ? 's' : ''}</Badge>}
        </div>
        {profile.summary && <p style={{ marginTop: 12, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{profile.summary}</p>}
        {(profile.location || languages.length > 0) && (
          <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {profile.location}{profile.location && languages.length > 0 ? ' · ' : ''}{languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}
          </p>
        )}
      </Card>

      {/* Skills — editable */}
      <SkillsCard skills={skills} onSkillsUpdated={(updated) => {
        setProfile(prev => prev ? { ...prev, skills: updated } : prev);
      }} />

      {/* Work Experience */}
      {experience.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Briefcase size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Work Experience</h4>
          </div>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < experience.length - 1 ? 18 : 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{exp.title}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 6px' }}>
                {exp.company} · {exp.startDate || '?'} – {exp.endDate || '?'}
              </p>
              {exp.responsibilities.length > 0 && (
                <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {exp.responsibilities.map((r, j) => <li key={j} style={{ marginBottom: 3 }}>{r}</li>)}
                </ul>
              )}
              {exp.technologies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {exp.technologies.map((t, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <GraduationCap size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Education</h4>
          </div>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: i < education.length - 1 ? 10 : 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0 }}>{edu.institution}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {[edu.degree, edu.field].filter(Boolean).join(' in ')}{edu.endDate ? ` · ${edu.endDate}` : ''}
              </p>
            </div>
          ))}
        </Card>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <FolderOpen size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Projects</h4>
          </div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: i < projects.length - 1 ? 10 : 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)', margin: 0 }}>{p.name}</p>
              {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 4px' }}>{p.description}</p>}
              {p.technologies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {p.technologies.map((t, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Editable Skills Card ───────────────────────────────────────────────────────
interface Skill { name: string; category: string }

function SkillsCard({ skills, onSkillsUpdated }: { skills: Skill[]; onSkillsUpdated: (s: Skill[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Skill[]>(skills);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync draft when skills prop changes (e.g. after re-upload)
  useEffect(() => { if (!editing) setDraft(skills); }, [skills, editing]);

  const startEdit = () => { setDraft([...skills]); setEditing(true); setError(null); };

  const cancel = () => { setDraft(skills); setEditing(false); setNewSkill(''); setError(null); };

  const removeSkill = (idx: number) => {
    setDraft(prev => prev.filter((_, i) => i !== idx));
  };

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    // Prevent duplicates (case-insensitive)
    if (draft.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" already exists`);
      return;
    }
    setDraft(prev => [...prev, { name, category: 'Other' }]);
    setNewSkill('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  };

  const save = async () => {
    if (draft.length === 0) {
      setError('Add at least one skill');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPatch('/api/auth/skills', { skills: draft });
      onSkillsUpdated(draft);
      setEditing(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wrench size={15} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Skills</h4>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            <Pencil size={12} /> Edit
          </Button>
        )}
      </div>

      {!editing ? (
        skills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.map((s, i) => (
              <Badge key={`${s.name}-${i}`} variant="neutral">{s.name}</Badge>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            No skills yet. Click Edit to add your skills for better job matching.
          </p>
        )
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {draft.map((s, i) => (
              <span
                key={`${s.name}-${i}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.78rem', padding: '3px 8px', borderRadius: 6,
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {s.name}
                <button
                  onClick={() => removeSkill(i)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, display: 'flex', color: 'var(--text-muted)',
                  }}
                  aria-label={`Remove ${s.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter"
              style={{
                flex: 1, padding: '6px 10px', fontSize: '0.82rem',
                borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <Button size="sm" variant="ghost" onClick={addSkill} disabled={!newSkill.trim()}>
              <Plus size={12} /> Add
            </Button>
          </div>

          {error && <p style={{ fontSize: '0.78rem', color: 'var(--error)', marginBottom: 8 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" onClick={save} disabled={saving}>
              <Check size={12} /> {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
// ── Inline Resume Uploader ─────────────────────────────────────────────────────
// Handles upload, dedup detection (silent toast for same resume), and profile update.
function ResumeUploader({ compact, onParsed }: { compact?: boolean; onParsed: (p: any) => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'reused'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10 MB.');
      return;
    }

    setStatus('uploading');
    setError(null);

    const token = localStorage.getItem('ejg_token');
    if (!token) { setError('Not signed in.'); setStatus('idle'); return; }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/auth/upload-resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (data.reused) {
        setStatus('reused');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        onParsed(data.profile);
        setStatus('idle');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStatus('idle');
    }
  }, [onParsed]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  // Compact mode: just a button (used in header next to "Parsed Resume")
  if (compact) {
    return (
      <div>
        <input ref={inputRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: 'none' }} />
        <Button
          variant="ghost" size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
        >
          <Upload size={12} /> {status === 'uploading' ? 'Parsing…' : 'Re-upload'}
        </Button>
        {status === 'reused' && (
          <p style={{ fontSize: '0.74rem', color: 'var(--success)', marginTop: 4 }}>
            Resume unchanged — profile already up to date.
          </p>
        )}
        {error && <p style={{ fontSize: '0.74rem', color: 'var(--error)', marginTop: 4 }}>{error}</p>}
      </div>
    );
  }

  // Full mode: drag-drop zone (used when no profile exists)
  return (
    <div>
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: 'none' }} />
      {status === 'reused' ? (
        <Alert type="info">Resume unchanged — profile already up to date.</Alert>
      ) : (
        <div
          onClick={() => status !== 'uploading' && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 10, padding: '28px 16px', textAlign: 'center',
            cursor: status === 'uploading' ? 'wait' : 'pointer',
            background: dragOver ? 'var(--bg-surface-2)' : 'transparent',
            // Specific properties only — never `all`. Strong ease-out, sub-300ms.
            transition: 'border-color 180ms cubic-bezier(0.23,1,0.32,1), background-color 180ms cubic-bezier(0.23,1,0.32,1)',
            opacity: status === 'uploading' ? 0.6 : 1,
          }}
        >
          {status === 'uploading' ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Parsing your resume… this takes a few seconds</p>
          ) : (
            <>
              <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 2 }}>
                Drop your resume here, or click to browse
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>PDF · up to 10 MB</p>
            </>
          )}
        </div>
      )}
      {error && <p style={{ fontSize: '0.78rem', color: 'var(--error)', marginTop: 8 }}>{error}</p>}
    </div>
  );
}