'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setStatus({
        type: 'success',
        text: 'Your message has been received. Our editorial desk will reply within 24 business hours.',
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      setStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error submitting form',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '96px' }}>
      <div className="container-narrow" style={{ maxWidth: '640px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
            }}
          >
            Direct Inquiries
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
              marginTop: '6px',
              marginBottom: '10px',
            }}
          >
            Contact Customer Support & Desk
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', margin: 0 }}>
            Have a question about a product, need invoice details, or need help with a download? Reach out directly.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '6px',
            padding: '36px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {status && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '4px',
                marginBottom: '24px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: status.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                color: status.type === 'success' ? '#166534' : '#B91C1C',
              }}
            >
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{status.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="input-group">
                <label className="input-label">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Thompson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Subject</label>
              <input
                type="text"
                required
                placeholder="Product question / Order inquiry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea
                required
                rows={5}
                placeholder="Describe your inquiry with as much detail as possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field"
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isLoading ? (
                'Submitting Message...'
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Message to Support</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
