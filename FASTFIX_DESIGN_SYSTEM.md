

### 1. Core Philosophy
- **Human + Technical**: Warm, approachable surfaces (Sand) paired with a crisp, analytical accent (Teal).
- **Semantically Safe**: The primary color does not conflict with Pass/Fail/Warning statuses.
- **Anti-AI Aesthetic**: Zero generic purple/indigo gradients; sharp, intentional geometry.



### 2. The Color Palette (Radix Primitives)

| Role | Light Mode Value | Dark Mode Value | Radix Token |
| :--- | :--- | :--- | :--- |
| **Page Canvas** | `#FBF9F8` | `#161615` | `--background` (Sand 1) |
| **Primary Accent** | `#14A085` | `#14A085` | `--accent-9` (Teal 9) |
| **Accent Hover** | `#0D7660` | `#0D7660` | `--accent-10` (Teal 10) |
| **Gray Anchor** | `#B9A89C` | `#B9A89C` | `--gray-9` (Sand 9) |
| **Surface / Cards** | Auto-generated (Sand 2/3) | Auto-generated (Sand 2/3) | `variant="surface"` |
| **Border Subtle** | Auto-generated (Sand 6) | Auto-generated (Sand 6) | `--gray-6` |

---

### 3. Semantic Status System (Crucial for Audits)
Since this is an accessibility/performance tool, do **not** use Teal for your audit results. Use these dedicated Radix accent colors strictly for statuses:

| Status | Radix Color | Usage |
| :--- | :--- | :--- |
| **✅ Pass / 90-100%** | **Jade** | Scorecards, green checks, passing audits. |
| **⚠️ Warning / 50-89%** | **Amber** | "Needs improvement" items, medium priority. |
| **❌ Fail / 0-49%** | **Tomato** | Critical violations, blocking errors, broken links. |
| **📊 Data Visuals** | **Gold** | *Extra:* Use Gold exclusively for charts, Speed Index, and LCP metrics to add that "human friction" I mentioned. |

---

### 4. Typography & Geometry
- **Font (UI)**: `Geist` (Vercel) or `Inter`. Use **font-weight 500** for sidebar labels and **450** for body text to feel sturdy, not thin.
- **Font (Code/Data)**: `JetBrains Mono` for performance numbers, audit IDs, and code snippets.
- **Border Radius**: **`Small`** (4px) or **`None`**. Absolutely no pill-shaped buttons (this screams AI default). 
- **Elevation**: Cards should use a subtle, low-elevation shadow (Radix `size="2"`) rather than heavy drop shadows.

---

### 5. React/Radix Implementation Code
Copy and paste this into your root layout. Notice we explicitly set `accentColor="teal"` and `grayColor="sand"`. 

```jsx
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

function App() {
  return (
    <Theme 
      accentColor="teal"      // Our primary #14A085
      grayColor="sand"        // Our warm background #B9A89C anchor
      radius="small"          // Sharp, intentional corners
      scaling="100%"          // Perfect pixel density
    >
      {/* Your app routes and components */}
    </Theme>
  );
}

export default App;
```

*(Optional but recommended CSS override to lock in the exact hex):*
```css
.radix-themes {
  --accent-9: #14A085;
  --accent-10: #0D7660;
}
```

---

### 6. Component Usage Guidelines
- **Primary Buttons**: Use `<Button variant="solid" color="teal">`. These are your main CTAs (e.g., "Run Audit", "Analyze").
- **Secondary Actions**: Use `<Button variant="surface" color="gray">`. This takes on the warm Sand color, keeping the UI calm.
- **Cards / Panels**: Use `<Card variant="surface" size="2">`. Radix will automatically calculate the perfect light/dark surface color based on your `#FBF9F8` or `#161615` canvas.
- **Badges for Results**: 
  - `<Badge color="jade">Passed</Badge>`
  - `<Badge color="amber">Warning</Badge>`
  - `<Badge color="tomato">Failed</Badge>`

---

### 7. Design Tokens (Quick Reference)
If you export these to Figma or CSS variables later, here is the exact map:

```css
--color-brand-primary: #14A085;
--color-brand-hover: #0D7660;
--color-bg-light: #FBF9F8;
--color-bg-dark: #161615;
--color-gray-warm: #B9A89C;
--color-status-pass: #00A36C;  /* Jade */
--color-status-warn: #FFB347;  /* Amber */
--color-status-fail: #E54B4B;  /* Tomato */
```
