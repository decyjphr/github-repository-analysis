# GitHub Repository Analytics Dashboard

A comprehensive data visualization platform for analyzing GitHub repository datasets through CSV uploads, providing statistical insights and interactive charts.

**Experience Qualities**: 
1. **Analytical** - Clear, data-driven insights with precise statistical calculations and meaningful visualizations
2. **Efficient** - Streamlined workflow from CSV upload to comprehensive analysis with minimal friction
3. **Professional** - Clean, dashboard-style interface that conveys authority and trustworthiness for data analysis

**Complexity Level**: Light Application (multiple features with basic state)
- Handles CSV parsing, statistical computations, and multiple chart types while maintaining straightforward user interactions

## Essential Features

### CSV Upload & Parsing
- **Functionality**: Accept CSV files with predefined schema and parse into structured data
- **Purpose**: Enable users to analyze their GitHub repository datasets
- **Trigger**: File input selection or drag-and-drop
- **Progression**: File selection → validation → parsing → data preview → analysis dashboard
- **Success criteria**: Successfully parse all expected columns and display row count confirmation

### Statistical Summary
- **Functionality**: Calculate descriptive statistics (count, mean, std, min, max, quartiles) for numerical columns
- **Purpose**: Provide immediate statistical overview of repository metrics
- **Trigger**: Successful CSV upload
- **Progression**: Data load → calculate stats → display summary table
- **Success criteria**: Accurate calculations displayed in organized table format

### Repository Size Analysis
- **Functionality**: Identify P10 and P90 repositories by size with detailed breakdown
- **Purpose**: Highlight size distribution extremes for capacity planning
- **Trigger**: Statistical analysis completion
- **Progression**: Size sorting → percentile calculation → repository identification → display
- **Success criteria**: Correct percentile repositories listed with names and sizes

### Interactive Histograms
- **Functionality**: Generate histograms for numerical fields with adjustable bins
- **Purpose**: Visualize data distributions and identify patterns
- **Trigger**: Tab navigation to histogram section
- **Progression**: Data selection → bin calculation → chart rendering → interaction
- **Success criteria**: Clear histograms with appropriate bin sizes and hover details

### Age vs Size Scatter Plot
- **Functionality**: Plot repository age against size, colored by record count intensity
- **Purpose**: Reveal correlations between repository maturity, size, and activity
- **Trigger**: Navigation to scatter plot section
- **Progression**: Age calculation → size mapping → color coding → plot rendering
- **Success criteria**: Clear correlation visualization with intuitive color gradient

### Activity Correlation Analysis
- **Functionality**: Scatter plot of commit comment count vs collaborator count
- **Purpose**: Understand relationship between team size and code review activity
- **Trigger**: Navigation to correlation section
- **Progression**: Data extraction → median calculation → plot generation → display
- **Success criteria**: Meaningful correlation visualization with trend indicators

## Edge Case Handling

- **Missing CSV Columns**: Display specific error message listing missing required fields
- **Invalid Data Types**: Skip invalid rows with notification of cleaning actions taken
- **Empty Dataset**: Show placeholder state with sample data format guidance
- **Large Files**: Implement progressive loading with status indicators for files >5MB
- **No Numerical Data**: Gracefully handle text-only datasets with appropriate messaging

## Design Direction

The interface should feel like a professional analytics dashboard - clean, focused, and data-centric with subtle sophistication that builds trust in the analysis results.

## Color Selection

Triadic color scheme emphasizing analytical clarity and professional credibility through balanced, purposeful color relationships.

- **Primary Color**: Deep Navy Blue (oklch(0.25 0.08 250)) - Conveys analytical authority and trustworthiness
- **Secondary Colors**: Warm Gray (oklch(0.65 0.02 85)) for backgrounds and Slate Blue (oklch(0.55 0.12 270)) for secondary actions
- **Accent Color**: Bright Orange (oklch(0.70 0.15 45)) - Draws attention to key data points and interactive elements
- **Foreground/Background Pairings**: 
  - Background White (oklch(0.98 0 0)): Dark Navy text (oklch(0.25 0.08 250)) - Ratio 12.1:1 ✓
  - Primary Navy (oklch(0.25 0.08 250)): White text (oklch(0.98 0 0)) - Ratio 12.1:1 ✓
  - Secondary Gray (oklch(0.65 0.02 85)): Dark Navy text (oklch(0.25 0.08 250)) - Ratio 4.8:1 ✓
  - Accent Orange (oklch(0.70 0.15 45)): White text (oklch(0.98 0 0)) - Ratio 5.2:1 ✓

## Font Selection

Typography should emphasize readability and precision appropriate for data analysis, using clean sans-serif fonts that support both statistical tables and chart labels.

- **Typographic Hierarchy**: 
  - H1 (Dashboard Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter SemiBold/24px/normal spacing  
  - H3 (Chart Titles): Inter Medium/18px/normal spacing
  - Body (Stats/Labels): Inter Regular/14px/relaxed line height
  - Small (Data Points): Inter Regular/12px/tight spacing

## Animations

Smooth, purposeful transitions that guide attention through data exploration without distracting from analytical focus.

- **Purposeful Meaning**: Subtle chart animations reinforce data relationships and state changes
- **Hierarchy of Movement**: File upload feedback gets primary animation focus, followed by chart transitions and hover states

## Component Selection

- **Components**: Card layouts for statistical summaries, Tabs for section navigation, Button for upload triggers, Table for statistical displays, custom chart components using recharts
- **Customizations**: Custom file drop zone with visual feedback, enhanced chart tooltips with statistical context
- **States**: Upload button shows loading/success states, charts display loading skeletons, error states show actionable guidance
- **Icon Selection**: Upload, BarChart, TrendingUp, Calculator icons from Phosphor set
- **Spacing**: Consistent 6-unit (24px) section gaps, 4-unit (16px) component spacing, 2-unit (8px) inner element padding
- **Mobile**: Single-column layout with collapsible chart sections, horizontal scroll for wide tables, touch-friendly chart interactions