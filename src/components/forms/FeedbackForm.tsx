'use client';
/** Rate your experience – DEMO (no API). Real: POST /public/feedback → admin Feedback inbox + ratings dashboard. */
import { useState, type FormEvent } from 'react';
import { sendFeedback } from '@/lib/demo/demo-service';
import { aria, DemoNote, FField } from './FormBits';
import { LOADER_PLANS, SmartLoader } from '@/components/ui/SmartLoader';

const TOPICS = ['Website', 'Becoming a member', 'Renewing', 'An Islamic Center', 'An event or program', 'Staff or volunteers', 'Something else'];
const LABELS = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];

export function FeedbackForm({ initialTopic }: { initialTopic?: string }) {
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState(initialTopic === 'website' ? 'Website' : '');
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!rating) er.rating = 'Choose a rating from 1 to 5 stars.';
    if (!topic) er.topic = 'Choose what your feedback is about.';
    if (rating && rating <= 2 && comment.trim().length < 10) er.comment = 'Tell us briefly what went wrong so we can fix it (at least 10 characters).';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) er.email = 'Enter a valid email address, like name@example.com.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await sendFeedback({ rating, topic, comment });
    setBusy(false); setDone(r.reference);
  };

  if (done) return (
    <div className="form-card done-card" role="status">
      <h2>Thank you for your feedback</h2>
      <p>Your reference is <b>{done}</b>.{email ? ' We will email you if we need more details.' : ''}</p>
      {rating <= 2 && <p>Sorry we let you down. If this is a serious problem, you can also <a href="/complaints">file a formal complaint</a>.</p>}
    </div>
  );

  return (
    <form className="form-card" aria-busy={busy || undefined} onSubmit={submit} noValidate>
      <DemoNote>Demo: nothing is sent yet. This shows how feedback will work.</DemoNote>
      <fieldset className="stars" aria-describedby={errors.rating ? 'rating-error' : undefined}>
        <legend>How was your experience?</legend>
        <div className="star-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? 'on' : ''} title={LABELS[n]}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
              <span aria-hidden="true">★</span><span className="sr-only">{n} star{n > 1 ? 's' : ''}, {LABELS[n]}</span>
            </label>
          ))}
          <span className="star-label" aria-live="polite">{LABELS[rating]}</span>
        </div>
        {errors.rating && <p className="field-error" id="rating-error">{errors.rating}</p>}
      </fieldset>
      <FField id="fb-topic" label="What is it about?" error={errors.topic}>
        <select id="fb-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} {...aria('fb-topic', false, errors.topic)}>
          <option value="">Choose one</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </FField>
      <FField id="fb-comment" label="Tell us more" optional={!(rating && rating <= 2)} hint={`${comment.length}/1000 characters`} error={errors.comment}>
        <textarea id="fb-comment" className="input textarea" maxLength={1000} rows={5} value={comment} onChange={(e) => setComment(e.target.value)} {...aria('fb-comment', true, errors.comment)} />
      </FField>
      <FField id="fb-email" label="Email, if you want a reply" optional error={errors.email}>
        <input id="fb-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...aria('fb-email', false, errors.email)} />
      </FField>
      <button className="btn btn-primary" type="submit" disabled={busy} data-busy={busy || undefined}>{busy ? 'Sending…' : 'Send feedback'}</button>
      <SmartLoader plan={LOADER_PLANS.feedback} active={busy} />
    </form>
  );
}
