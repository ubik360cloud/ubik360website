-- Lets a flow step's CTA render as a labeled text link ("Let's Talk: <url>"
-- / "¿Hablamos?: <url>") instead of a bare URL -- these are plain-text
-- emails with no styled buttons, so a short caption before the link is the
-- plain-text equivalent of anchor text. Nullable: falls back to the bare
-- URL (existing behavior) when not set.
alter table flow_steps add column cta_label text;
