'use client';
/** Renders the admin's join-form sections (from the form builder). Field ids: f-custom-<id> (error summary links). */
import type { ReactNode } from 'react';
import { fieldShown, type Answers, type FormCtx, type JoinField, type JoinSection } from '@/lib/join/form-def';

type Props = { sections: JoinSection[]; answers: Answers; ctx: FormCtx; errors: Record<string, string>; onChange: (id: string, v: Answers[string]) => void; filled?: Record<string, string>; asStep?: boolean };

export function CustomSections({ sections, answers, ctx, errors, onChange, filled = {}, asStep }: Props) {
  return (
    <>
      {sections.map((s) => {
        const fields = s.fields.filter((f) => fieldShown(f, answers, ctx));
        if (!fields.length) return null;
        const body = fields.map((f) => <CustomField key={f.id} f={f} value={answers[f.id]} error={errors[`custom.${f.id}`]} onChange={(v) => onChange(f.id, v)} filled={filled[f.id]} />);
        return asStep ? <div key={s.id} className="jf-custom" data-section={s.id}>{s.intro && <p className="jf-lead">{s.intro}</p>}{body}</div> : (
          <fieldset key={s.id} className="jf-fieldset jf-custom" data-section={s.id}>
            <legend>{s.title}</legend>
            {s.intro && <p className="hint">{s.intro}</p>}
            {body}
          </fieldset>
        );
      })}
    </>
  );
}

function Wrap({ id, f, error, children, filled, group }: { id: string; f: JoinField; error?: string; children: ReactNode; filled?: string; group?: boolean }) {
  const label = <>{f.label}{!f.required && f.type !== 'info' && f.type !== 'consent' && <span className="opt"> (optional)</span>}{filled && <span className="jf-filled">{filled}</span>}</>;
  const hint = f.help ? <p className="hint" id={`${id}-hint`}>{f.help}</p> : null;
  const err = error ? <p className="field-error" id={`${id}-error`}>{error}</p> : null;
  return group ? (
    <fieldset className={`jf-field jf-group${error ? ' has-error' : ''}`} id={id} aria-describedby={[f.help ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}>
      <legend>{label}</legend>{hint}{children}{err}
    </fieldset>
  ) : (
    <div className={`jf-field${error ? ' has-error' : ''}`}><label htmlFor={id}>{label}</label>{hint}{children}{err}</div>
  );
}

export function CustomField({ f, value, error, onChange, filled }: { f: JoinField; value: Answers[string]; error?: string; onChange: (v: Answers[string]) => void; filled?: string }) {
  const id = `f-custom-${f.id}`;
  const a11y = { 'aria-invalid': !!error || undefined, 'aria-describedby': [f.help ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined };
  const str = typeof value === 'string' ? value : '';
  const list = Array.isArray(value) ? value : [];
  switch (f.type) {
    case 'info': return <p className="jf-info" id={id}>{f.label}{f.help ? <small className="block-hint">{f.help}</small> : null}</p>;
    case 'textarea': return <Wrap id={id} f={f} error={error} filled={filled}><textarea id={id} className="input" rows={3} maxLength={f.maxLength} placeholder={f.placeholder} value={str} onChange={(e) => onChange(e.target.value)} {...a11y} /></Wrap>;
    case 'select': return (
      <Wrap id={id} f={f} error={error} filled={filled}>
        <select id={id} className="input" value={str} onChange={(e) => onChange(e.target.value)} {...a11y}>
          <option value="">Choose one</option>{(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Wrap>
    );
    case 'radio': case 'yesno': {
      const opts = f.type === 'yesno' ? [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] : f.options ?? [];
      return (
        <Wrap id={id} f={f} error={error} filled={filled} group>
          <div className="choice-row compact">{opts.map((o) => (
            <label key={o.value} className={`choice${str === o.value ? ' on' : ''}`}><input type="radio" name={id} value={o.value} checked={str === o.value} onChange={() => onChange(o.value)} /> <span><b>{o.label}</b></span></label>
          ))}</div>
        </Wrap>
      );
    }
    case 'checkboxes': return (
      <Wrap id={id} f={f} error={error} filled={filled} group>
        <div className="check-grid">{(f.options ?? []).map((o) => (
          <label key={o.value} className="check"><input type="checkbox" checked={list.includes(o.value)} onChange={(e) => onChange(e.target.checked ? [...list, o.value] : list.filter((x) => x !== o.value))} /> <span>{o.label}</span></label>
        ))}</div>
      </Wrap>
    );
    case 'consent': return (
      <div className={`jf-field${error ? ' has-error' : ''}`} id={id}>
        <label className="check"><input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} {...a11y} /> <span>{f.label}{f.help && <small className="block-hint" id={`${id}-hint`}>{f.help}</small>}</span></label>
        {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
      </div>
    );
    default: {
      const type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text';
      return (
        <Wrap id={id} f={f} error={error} filled={filled}>
          <input id={id} className={`input${f.type === 'number' ? ' narrow-input' : ''}`} type={type} inputMode={f.type === 'number' ? 'numeric' : f.type === 'phone' ? 'tel' : undefined}
            min={f.min} max={f.max} maxLength={f.maxLength} placeholder={f.placeholder} value={str} onChange={(e) => onChange(e.target.value)} {...a11y} />
        </Wrap>
      );
    }
  }
}

/** Plain-language answer for the review step. */
export function answerText(f: JoinField, v: Answers[string]) {
  if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '';
  if (f.type === 'yesno') return v === 'yes' ? 'Yes' : 'No';
  if (f.type === 'consent') return v === true ? 'Agreed' : '';
  if (Array.isArray(v)) return v.map((x) => f.options?.find((o) => o.value === x)?.label ?? x).join(', ');
  if (f.type === 'select' || f.type === 'radio') return f.options?.find((o) => o.value === v)?.label ?? String(v);
  return String(v);
}
