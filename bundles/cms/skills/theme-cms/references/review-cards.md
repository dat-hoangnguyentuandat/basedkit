# Review Cards

Use one shared review-avatar partial and one review-content pattern on the homepage block and `/danh-gia`. Do not maintain separate fallback logic.

## Avatar contract

Model accessors may return uploaded, theme, or remote Google avatar URLs. A non-empty remote URL is not proof that the image will load: it can expire, reject hotlinking, or fail after the first paint.

Render initials first and place the image above them in the same fixed-size wrapper:

```blade
@php
  $name = trim((string) ($review->name ?? $review->reviewer_name ?? 'Khách hàng'));
  $parts = preg_split('/\s+/u', $name, -1, PREG_SPLIT_NO_EMPTY);
  $initials = collect($parts)->take(2)
      ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1, 'UTF-8'), 'UTF-8'))
      ->implode('') ?: 'KH';
  $avatarUrl = (string) ($review->avatar_url ?? '');
@endphp
<span class="review-avatar" aria-hidden="true">
  <span class="review-avatar__initials">{{ $initials }}</span>
  @if($avatarUrl !== '')
    <img src="{{ $avatarUrl }}" alt="" loading="lazy"
         referrerpolicy="no-referrer" onerror="this.hidden=true">
  @endif
</span>
```

```css
.review-avatar{position:relative;display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border-radius:50%;overflow:hidden}
.review-avatar>*{grid-area:1/1;width:42px;height:42px;border-radius:50%}
.review-avatar__initials{display:grid;place-items:center;background:var(--avatar-bg);color:var(--primary);font-weight:700}
.review-avatar img{display:block;object-fit:cover}
```

The initials must never start with `hidden`. Keeping them underneath the image removes timing races: a valid image covers them, while a failed image hides itself and reveals them immediately. Do not use only an `@if($avatarUrl)` branch with no runtime fallback. Do not render the reviewer name as `alt`; it becomes visible broken-image text on failure.

## Long review contract

Keep the full review in the model and rendered page, but bound the grid excerpt:

```blade
<blockquote class="review-excerpt">“{{ $review->content }}”</blockquote>
@if(mb_strlen((string) $review->content) > 360)
  <button class="review-expand" type="button">Xem đầy đủ</button>
  <template class="review-full-content">{{ $review->content }}</template>
@endif
```

```css
.review-card{display:flex;flex-direction:column;height:100%;min-width:0}
.review-excerpt{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:8;line-clamp:8}
.review-author{margin-top:auto;padding-top:22px}
```

Open the template content through an accessible native dialog or equivalent modal with a bounded viewport and internal scrolling. Set content with `textContent`, not `innerHTML`. Provide a named close button, Escape support, backdrop close when appropriate, and remove transient dialogs after close. The default card grid must remain equal-height; reading the full review must not force sibling cards to match an unbounded height.

## Required tests

1. Render a row containing no avatar, a valid local/uploaded avatar, a valid remote avatar, and a deliberately invalid remote URL.
2. Wait for `load`/`error`, then capture the rendered page. Require no broken-image icons, visible alt fragments, blank avatar circles, or layout shifts.
3. Render short, medium, 360+ character, and multi-paragraph reviews in the same grid. Require equal card heights and aligned authors before interaction.
4. Activate `Xem đầy đủ`; verify the complete unmodified text, close/focus behavior, bounded dialog height, and mobile scrolling.
5. Repeat on the homepage review block and `/danh-gia`, including a pagination page containing the longest imported review.
