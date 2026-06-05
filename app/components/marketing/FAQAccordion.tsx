import {useId, useState} from 'react';
import type {Faq} from '~/data/faq';

function ChevronIcon({open}: {open: boolean}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function FAQItem({faq}: {faq: Faq}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left font-tight text-lg font-medium text-ink transition-colors hover:text-purple"
        >
          {faq.question}
          <ChevronIcon open={open} />
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        hidden={!open}
        className="pb-5 pr-8 text-base leading-relaxed text-muted"
      >
        {faq.answer}
      </div>
    </div>
  );
}

export function FAQAccordion({items}: {items: Faq[]}) {
  return (
    <div className="rounded-card border border-line bg-surface/60 px-6 sm:px-8">
      {items.map((faq) => (
        <FAQItem key={faq.question} faq={faq} />
      ))}
    </div>
  );
}
