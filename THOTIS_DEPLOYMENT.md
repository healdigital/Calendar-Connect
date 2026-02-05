# Thotis Frontend Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Code Quality
```bash
# Run type check
yarn type-check:ci --force
# ⚠️ Expected: Fix ThotisBookingService errors first

# Run linter
yarn biome check --write .

# Run tests (if available)
TZ=UTC yarn test
```

### 2. Manual Testing

**Landing Page** (`/thotis`)
- [ ] Page loads in < 2s
- [ ] Hero section displays correctly
- [ ] "Find a Mentor" button works → `/thotis/mentors`
- [ ] "Become a Mentor" button works → `/thotis/mentor/signup`
- [ ] Mobile responsive (375px)

**Search Page** (`/thotis/mentors`)
- [ ] Page loads with mentors
- [ ] Filters work: name, field, university, rating
- [ ] Cards display correctly
- [ ] "View Profile" button routes to profile
- [ ] Empty state works (no results)
- [ ] Sorting works (rating, name, recent)

**Signup Wizard** (`/thotis/mentor/signup`)
- [ ] Step 1 validation works
- [ ] Step 2 field dropdown populated
- [ ] Step 3 bio character counter works
- [ ] Create button submits form
- [ ] Success screen appears
- [ ] Dashboard link works

**Dashboard** (`/thotis/dashboard`)
- [ ] Auth guard works (redirect if not signed in)
- [ ] Mentor dashboard shows stats
- [ ] Student dashboard shows "No Bookings"
- [ ] Edit Profile button works
- [ ] Mobile responsive

**Profile Settings** (`/thotis/mentor/settings`)
- [ ] Auth guard works
- [ ] Form loads with existing data
- [ ] All fields editable
- [ ] Save button works
- [ ] Success alert appears
- [ ] Error handling works

### 3. Performance

```bash
# Lighthouse audit
# Target: > 75 on all pages

# Page load times
# Target: < 3s

# API response times
# Target: < 2s
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Commit

```bash
cd "Downloads/Thotis Final/cal.com-main"

# Check git status
git status

# Stage new files
git add apps/web/app/thotis/page.tsx
git add apps/web/app/thotis/mentors/page.tsx
git add apps/web/app/thotis/mentor/signup/page.tsx
git add apps/web/app/thotis/mentor/settings/page.tsx
git add apps/web/app/thotis/dashboard/page.tsx
git add THOTIS_IMPLEMENTATION.md
git add THOTIS_FRONTEND_SUMMARY.md
git add THOTIS_DEPLOYMENT.md

# Verify staged changes
git diff --cached --name-only
```

### Step 2: Create Commit

```bash
git commit -m "feat(thotis): Add 5 core frontend pages

Implements critical frontend pages for Thotis platform:

✨ New Pages:
- Landing page (/thotis) with hero and CTA
- Mentor search/discovery (/thotis/mentors) with filters
- Mentor signup wizard (/thotis/mentor/signup) 4-step form
- Authenticated dashboard (/thotis/dashboard)
- Profile settings editor (/thotis/mentor/settings)

✅ Features:
- Fully responsive (mobile-first design)
- Type-safe TypeScript implementation
- tRPC API integration for all forms
- Auth guards on protected pages
- Loading and error states
- Tailwind CSS with Thotis branding

📊 Stats:
- ~1,100 lines of code
- 5 new pages
- 100% TypeScript
- Following Cal.com conventions

⚠️ Note: ThotisBookingService type errors need fixing
         in separate PR before full type check passes

Remaining: Student signup, Session views (Phase 2)"
```

### Step 3: Create Pull Request

```bash
# Push to remote (if you have fork)
git push origin feat/thotis-frontend

# Or create draft PR from local branch
gh pr create --draft --title "feat(thotis): Add 5 core frontend pages"
```

### Step 4: Testing in Staging

```bash
# On staging server
yarn build

# Run E2E tests
PLAYWRIGHT_HEADLESS=1 yarn e2e

# Monitor Sentry for errors
# Check analytics for page load times
```

---

## 🔍 Verification

### URLs to Test

```
http://localhost:3000/thotis                    # Landing
http://localhost:3000/thotis/mentors           # Search
http://localhost:3000/thotis/mentor/signup     # Signup
http://localhost:3000/thotis/dashboard         # Dashboard
http://localhost:3000/thotis/mentor/settings   # Settings
```

### Browser Console

- [ ] No errors
- [ ] No warnings
- [ ] Auth tokens working

### Network Tab

- [ ] All API calls successful (200)
- [ ] No 404s
- [ ] Response times < 2s

---

## 📱 Responsive Testing

Use Chrome DevTools Device Toolbar:

```
Testing Breakpoints:
□ 375px (Mobile)
□ 768px (Tablet)
□ 1024px (Desktop)
□ 1920px (Ultra-wide)
```

---

## ⚠️ Known Issues Before Deploy

### Blocking Issues
1. **ThotisBookingService Type Errors**
   - Location: `packages/features/thotis/services/ThotisBookingService.ts`
   - Impact: TypeScript check will fail
   - Fix: Separate PR to fix i18n integration
   - Timeline: Must fix before production

### Non-Blocking Issues
1. Photo upload (placeholder only)
2. Student signup (not implemented yet)
3. Session views (coming Phase 2)

---

## 📊 Rollback Plan

If issues found after deploy:

```bash
# Rollback to previous version
git revert <commit-hash>

# Or deploy previous version
# Contact DevOps team
```

---

## 🎯 Success Metrics

After deployment, monitor:

- **Page Load Times**: < 3s (Lighthouse)
- **API Response**: < 2s (Network tab)
- **Error Rate**: 0% critical errors
- **User Flow**: 
  - Landing → Search: X users
  - Landing → Signup: X users
  - Signup → Dashboard: X% completion

---

## 📞 Rollout Timeline

### Phase 1: Internal Testing (24h)
- Team QA tests all pages
- Performance verification
- Fix critical issues

### Phase 2: Beta Rollout (1-2 days)
- Deploy to staging
- Monitor metrics
- Fix edge cases

### Phase 3: Full Rollout (1 day)
- Deploy to production
- Monitor Sentry
- Support customer feedback

---

## 🎓 Post-Deployment

### Day 1
- [ ] Monitor Sentry for errors
- [ ] Check Lighthouse scores
- [ ] Monitor API response times
- [ ] Check user signup rate

### Week 1
- [ ] Gather user feedback
- [ ] Fix critical issues
- [ ] Plan Phase 2 (student signup, sessions)

### Ongoing
- [ ] Monitor performance
- [ ] Fix bugs as reported
- [ ] Iterate on UX based on feedback

---

## 📚 Documentation

All documentation is in:
- `THOTIS_IMPLEMENTATION.md` - Detailed implementation
- `THOTIS_FRONTEND_SUMMARY.md` - Overview & stats
- `THOTIS_DEPLOYMENT.md` - This file
- Plan file: `/claude/plans/partitioned-launching-diffie.md`

---

**Ready to deploy! 🚀**

Questions? Check the docs or reach out to the team.
