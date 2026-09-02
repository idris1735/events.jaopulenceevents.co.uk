-- ============================================================
-- Brand copy update (J&A Branding Outline).
-- Aligns the live event copy with the brand voice:
-- "A premium party experience bringing together culture,
--  elegance, and connection."
-- ============================================================

update public.events
set
  summary     = 'A premium party experience bringing together culture, elegance, and connection.',
  description = 'J&A Opulence Events proudly presents the Winter Masquerade Ball — a night of mystery, joy, and opulence. Cocktail reception, red carpet arrivals, live sax, DJ KK with a surprise DJ, live entertainment, bottomless drinks, and Best Masquerade awards for male and female guests. Dress with intention and step into a space that feels rare, elevated, and unforgettable.',
  hero_label  = 'An Evening of Elegance'
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';

-- Verify
select id, name, hero_label, summary, left(description, 120) as description_preview
from public.events
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';
