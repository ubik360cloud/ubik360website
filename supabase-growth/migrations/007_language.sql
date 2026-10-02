-- Stores the language a flow/draft was actually written in (set at draft
-- time from the segment's/contact's geography, editable after) so the
-- auto-appended signature and opt-out footer can match it at send time --
-- deriving language from geography again at send time was considered and
-- rejected: if Jose ever hand-edits a draft into the other language, a
-- geography-based re-derivation at send time would silently disagree with
-- what's actually in the body. Storing it explicitly, with a visible
-- override in the UI, avoids that.
alter table flows add column language text not null default 'en';
alter table oneoffs add column language text not null default 'en';
