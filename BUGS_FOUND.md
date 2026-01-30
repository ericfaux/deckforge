# DeckForge - Critical Bugs & Issues

**Test Session:** 2026-01-30
**Site:** https://deckforge-xi.vercel.app

## 🔴 CRITICAL (Blocking Core Features)

### 1. CORS Error - Backend Blocking Frontend Requests
**Severity:** CRITICAL  
**Impact:** Fonts cannot load, breaks core text functionality  
**Error:**
```
Access to XMLHttpRequest at 'https://backend-afteryou.vercel.app/fonts' 
from origin 'https://deckforge-xi.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Reproduction:**
1. Open site
2. Open browser console
3. Error appears immediately on page load
4. Repeats when adding text or returning from auth modal

**Root Cause:** Backend `/fonts` endpoint not configured with proper CORS headers

**Fix Required:**
- Add CORS middleware to backend
- Allow `https://deckforge-xi.vercel.app` origin
- Add proper preflight OPTIONS handling

### 2. Empty Font Dropdown
**Severity:** HIGH  
**Impact:** Users cannot change fonts (stuck with default)  
**Related to:** Issue #1 (CORS error)

**Reproduction:**
1. Add text element
2. Click Font Family dropdown in Inspector
3. Dropdown is empty - no fonts listed

**Root Cause:** Font list fails to load due to CORS error

**Fix Required:**
- Fix CORS issue (#1)
- Add fallback fonts in case API fails
- Show loading state while fonts load

## 🟡 MEDIUM (UX Issues)

### 3. Multiple Font Load Attempts
**Severity:** MEDIUM  
**Impact:** Unnecessary API calls, console spam  

**Observation:**
- Font preload happens on initial page load
- Happens again when returning from auth modal
- Each attempt generates CORS error

**Fix Required:**
- Implement font caching/memoization
- Only fetch fonts once per session
- Handle errors gracefully (don't retry immediately)

## ✅ WORKING CORRECTLY

- ✅ Text creation (keyboard shortcut T works)
- ✅ Text appears on canvas with default styling
- ✅ Inspector panel opens and shows properties
- ✅ Layer management (shows "SKATE" layer)
- ✅ Undo functionality (button shows "1" after adding text)
- ✅ Auth modal opens when clicking Save
- ✅ "Continue as Guest" flow works
- ✅ Design persists after auth modal navigation
- ✅ Canvas rendering

## 🔧 Priority Fix Order

1. **IMMEDIATE:** Fix CORS configuration in backend
2. **IMMEDIATE:** Add fallback fonts to frontend
3. **SHORT-TERM:** Implement font caching
4. **SHORT-TERM:** Add proper error handling for API failures

## Next Testing Steps

After fixing CORS:
- [ ] Verify fonts load successfully
- [ ] Test font dropdown populates
- [ ] Test changing fonts
- [ ] Test custom font upload
- [ ] Test save/load with actual auth
- [ ] Test export functionality
- [ ] Test all other tools (shapes, stickers, etc.)
- [ ] Test keyboard shortcuts
- [ ] Mobile responsiveness
