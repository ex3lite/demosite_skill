"use client";

import { useState } from "react";
import { site, img, ruDate, initials, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Stars";

type ReviewItem = {
  author: string;
  rating?: number;
  date?: string;
  text: string;
  avatar?: string;
};

type Aggregate = { rating: number; count?: number } | null;

export default function Reviews({ data }: { data: Section }) {
  const v = variantOf("reviews", "grid");

  const items: ReviewItem[] = data.items ?? [];
  const agg: Aggregate =
    data.aggregate ??
    (site.stats?.rating
      ? { rating: site.stats.rating, count: site.stats.reviews_count }
      : null);

  const eyebrow = data.eyebrow ?? "Отзывы";
  const title = data.title ?? "Что говорят клиенты";
  const subtitle = data.subtitle;

  return (
    <SectionWrap
      id={data.id}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
    >
      {agg ? <AggregateSummary agg={agg} /> : null}

      {items.length === 0 ? null : v === "slider" ? (
        <ReviewsSlider items={items} />
      ) : v === "feature" ? (
        <ReviewsFeature items={items} />
      ) : (
        <ReviewsGrid items={items} />
      )}
    </SectionWrap>
  );
}

function AggregateSummary({ agg }: { agg: { rating: number; count?: number } }) {
  return (
    <div className="ds-reveal mb-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-6">
      <span className="font-display text-5xl text-primary tabular-nums leading-none">
        {agg.rating.toFixed(1)}
      </span>
      <div className="flex flex-col items-center gap-1 sm:items-start">
        <Stars value={agg.rating} />
        {agg.count ? (
          <span className="text-muted text-sm">
            на основе {agg.count} отзывов
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({
  author,
  avatar,
  className = "h-11 w-11",
}: {
  author: string;
  avatar?: string;
  className?: string;
}) {
  const src = img(avatar);
  if (src) {
    return (
      <img
        src={src}
        alt={`Фото клиента ${author}`}
        loading="lazy"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm text-primary`}
    >
      {initials(author)}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <figure className="ds-hover-lift flex h-full flex-col rounded-[var(--radius)] border border-border bg-surface p-6">
      <Icon name="quote" className="h-7 w-7 text-accent" />
      <div className="mt-4">
        <Stars value={item.rating ?? 5} />
      </div>
      <blockquote className="mt-4 flex-1 text-muted leading-relaxed">
        {item.text}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <Avatar author={item.author} avatar={item.avatar} />
        <div className="min-w-0">
          <div className="truncate font-medium text-text">{item.author}</div>
          {item.date ? (
            <div className="text-muted text-sm tabular-nums">
              {ruDate(item.date)}
            </div>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

function ReviewsGrid({ items }: { items: ReviewItem[] }) {
  return (
    <div className="ds-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ReviewCard key={i} item={item} />
      ))}
    </div>
  );
}

function ReviewsSlider({ items }: { items: ReviewItem[] }) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const active = items[index];

  const go = (dir: number) => {
    setIndex((prev) => (prev + dir + total) % total);
  };

  return (
    <div className="ds-reveal mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface p-8 text-center sm:p-12">
        <Icon
          name="quote"
          className="mx-auto h-9 w-9 text-accent"
        />
        <div
          key={index}
          className="ds-reveal"
          style={{ transition: "opacity 400ms var(--ease-out), transform 400ms var(--ease-out)" }}
        >
          <div className="mt-6 flex justify-center">
            <Stars value={active.rating ?? 5} />
          </div>
          <blockquote className="mx-auto mt-6 max-w-2xl font-display text-xl text-text leading-relaxed sm:text-2xl">
            {active.text}
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Avatar author={active.author} avatar={active.avatar} />
            <div className="text-left">
              <div className="font-medium text-text">{active.author}</div>
              {active.date ? (
                <div className="text-muted text-sm tabular-nums">
                  {ruDate(active.date)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {total > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Предыдущий отзыв"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-border bg-surface text-text transition-colors hover:border-primary hover:text-primary active:scale-95"
          >
            <Icon name="arrowRight" className="h-5 w-5 -scale-x-100" />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Отзывы">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Отзыв ${i + 1}`}
                aria-selected={i === index}
                role="tab"
                className={`h-2 cursor-pointer rounded-full transition-all ${
                  i === index ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Следующий отзыв"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-border bg-surface text-text transition-colors hover:border-primary hover:text-primary active:scale-95"
          >
            <Icon name="arrowRight" className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ReviewsFeature({ items }: { items: ReviewItem[] }) {
  const [lead, ...rest] = items;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
      <figure className="ds-reveal flex flex-col justify-between rounded-[var(--radius)] bg-primary p-8 text-primary-fg sm:p-10">
        <div>
          <Icon name="quote" className="h-10 w-10 text-primary-fg/70" />
          <div className="mt-5">
            <Stars value={lead.rating ?? 5} />
          </div>
          <blockquote className="mt-5 font-display text-2xl leading-relaxed sm:text-3xl">
            {lead.text}
          </blockquote>
        </div>
        <figcaption className="mt-8 flex items-center gap-3 border-t border-white/15 pt-6">
          <Avatar author={lead.author} avatar={lead.avatar} />
          <div className="min-w-0">
            <div className="truncate font-medium">{lead.author}</div>
            {lead.date ? (
              <div className="text-primary-fg/70 text-sm tabular-nums">
                {ruDate(lead.date)}
              </div>
            ) : null}
          </div>
        </figcaption>
      </figure>

      {rest.length > 0 ? (
        <div className="ds-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {rest.slice(0, 4).map((item, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-[var(--radius)] border border-border bg-surface p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <Stars value={item.rating ?? 5} />
                <Icon name="quote" className="h-5 w-5 text-accent" />
              </div>
              <blockquote className="mt-3 flex-1 text-muted leading-relaxed">
                {item.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <Avatar
                  author={item.author}
                  avatar={item.avatar}
                  className="h-9 w-9"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium text-text">
                    {item.author}
                  </div>
                  {item.date ? (
                    <div className="text-muted text-sm tabular-nums">
                      {ruDate(item.date)}
                    </div>
                  ) : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
