/** Page views for feedback, complaints and verify (kept out of page.tsx – Next.js pages may only export default + config). */
import { FeedbackForm } from './FeedbackForm';
import { ComplaintForm } from './ComplaintForm';
import { VerifyForm } from './VerifyForm';

export function FeedbackView({ topic }: { topic?: string }) {
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><h1>Rate your experience</h1><p className="intro">Tell us what works and what does not. It takes less than a minute and helps us improve ISGH services.</p></header>
      <FeedbackForm initialTopic={topic} />
    </div></article>
  );
}

export function ComplaintsView() {
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><h1>File a complaint</h1><p className="intro">If something went wrong with your membership, an election, a center or how you were treated, tell us. We take every complaint seriously and keep it confidential.</p></header>
      <ComplaintForm />
    </div></article>
  );
}

export function VerifyView() {
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><h1>Verify a membership</h1><p className="intro">Check whether an ISGH membership is active, for example before an election or a member-only program.</p></header>
      <VerifyForm />
    </div></article>
  );
}
