# Phase 8: Nigeria Geography Data Integration

## Overview
Added comprehensive Nigeria geography data with dropdown selectors to replace text inputs across admin forms.

## What Was Added

### Data Files
1. **`src/data/nigeria-states.json`**
   - 37 entries: 36 Nigerian states + FCT (Federal Capital Territory)
   - Fields: `name`, `capital`, `code`
   - Example: `{ "name": "Lagos", "capital": "Ikeja", "code": "LA" }`

2. **`src/data/nigeria-lgas.json`**
   - 774 Local Government Areas organized by state
   - Fields: `state`, `alias`, `lgas` (array)
   - Handles FCT naming: "FCT" in states list, "Federal Capital Territory" in LGAs with alias "abuja"
   - Example:
     ```json
     {
       "state": "Lagos",
       "alias": "lagos",
       "lgas": ["Agege", "Alimosho", "Apapa", ...]
     }
     ```

### UI Components
1. **`src/components/ui/state-select.tsx`**
   - Dropdown for selecting Nigerian states
   - Props: `value`, `onChange`, `required`, `disabled`, `className`
   - Populates from `nigeria-states.json`

2. **`src/components/ui/lga-select.tsx`**
   - Dropdown for selecting Local Government Areas
   - Dynamically filters LGAs based on selected state
   - Automatically handles FCT naming variations
   - Disabled until a state is selected
   - Props: `state`, `value`, `onChange`, `required`, `disabled`, `className`

## Form Integration

### Admin Project Form (`src/app/admin/projects/[id]/page.tsx`)
- **State field**: Changed from text input to `StateSelect` dropdown
- **LGA field**: Changed from text input to `LGASelect` dropdown
- **Behavior**: When state changes, LGA is automatically cleared
- **Location**: Government Classification section

### Submission Approval Form (`src/app/admin/submissions/page.tsx`)
- **State field**: Changed from text input to `StateSelect` dropdown
- **LGA field**: Added new field with `LGASelect` dropdown
- **Behavior**: LGA clears when state changes during approval
- **Data flow**: Admin selects state/LGA when approving public submissions

### Public Submission Form
- **No changes**: Kept intentionally simple
- Public users describe projects in free text
- Admins assign structured geography data during approval

## Usage Example

```tsx
import { StateSelect } from '@/components/ui/state-select';
import { LGASelect } from '@/components/ui/lga-select';

const [state, setState] = useState('');
const [lga, setLga] = useState('');

// State dropdown
<StateSelect
  value={state}
  onChange={(value) => {
    setState(value);
    setLga(''); // Clear LGA when state changes
  }}
/>

// LGA dropdown (filtered by state)
<LGASelect
  state={state}
  value={lga}
  onChange={setLga}
/>
```

## Technical Details

### FCT Handling
The Federal Capital Territory has inconsistent naming:
- **states.json**: Listed as "FCT"
- **lgas.json**: Listed as "Federal Capital Territory" with alias "abuja"
- **LGASelect component**: Handles this mapping automatically

```tsx
const stateData = nigeriaLgas.find(
  (s) => s.state === state || (state === "FCT" && s.alias === "abuja")
);
```

### State Change Behavior
When a user changes the state selection, the LGA is automatically cleared to prevent invalid state-LGA combinations:

```tsx
onChange={(value) => {
  handleChange('state', value);
  if (formData.lga) {
    handleChange('lga', '');
  }
}}
```

## Data Source
LGA data sourced from:
- GitHub Gist: https://gist.githubusercontent.com/apostleyemi/a3f5b141cbe1c496c5b804307ce69bb6/raw
- Comprehensive list of all 774 Nigerian LGAs organized by state

## Benefits
1. **Data accuracy**: Prevents typos and inconsistent naming
2. **User experience**: Easy selection from predefined lists
3. **Data integrity**: Valid state-LGA combinations only
4. **Searchability**: Standardized names improve filtering and reporting
5. **Scalability**: Easy to add more geography-based features later

## Testing Checklist
- [ ] Create new project with state/LGA dropdowns
- [ ] Edit existing project and change state (verify LGA clears)
- [ ] Approve submission and select state/LGA
- [ ] Verify FCT and its 6 Area Councils load correctly
- [ ] Test LGA filtering for different states
- [ ] Verify dropdown is disabled when no state selected
- [ ] Check that all 37 states appear in dropdown
- [ ] Validate form submission with selected geography data

## Future Enhancements
- Add geolocation (coordinates) for each state/LGA
- Add regional groupings (North, South, East, West, etc.)
- Add population data for impact analysis
- Consider adding senatorial districts
- Add search/autocomplete for large LGA lists
