/**
 * SVG Icon Library
 *
 * Professional inline SVG icons for use in generated websites.
 * Using inline SVGs instead of emoji for a polished, professional look.
 */

export interface IconOptions {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Generate an SVG icon with optional size and class
 */
function createIcon(
  paths: string,
  options: IconOptions = {},
  fill: boolean = false
): string {
  const { size = 24, className = '', strokeWidth = 1.5 } = options;
  const fillAttr = fill ? 'currentColor' : 'none';
  const strokeAttr = fill ? 'none' : 'currentColor';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${className ? ` class="${className}"` : ''}>${paths}</svg>`;
}

/**
 * Icon definitions - all use Heroicons-style paths
 */
export const icons = {
  // General UI
  check: (opts?: IconOptions) => createIcon(
    '<path d="M20 6L9 17l-5-5"/>',
    opts
  ),

  checkCircle: (opts?: IconOptions) => createIcon(
    '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    opts
  ),

  star: (opts?: IconOptions) => createIcon(
    '<path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>',
    opts,
    true
  ),

  phone: (opts?: IconOptions) => createIcon(
    '<path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>',
    opts
  ),

  email: (opts?: IconOptions) => createIcon(
    '<path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>',
    opts
  ),

  location: (opts?: IconOptions) => createIcon(
    '<path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>',
    opts
  ),

  clock: (opts?: IconOptions) => createIcon(
    '<path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    opts
  ),

  calendar: (opts?: IconOptions) => createIcon(
    '<path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>',
    opts
  ),

  arrowRight: (opts?: IconOptions) => createIcon(
    '<path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>',
    opts
  ),

  // Plumbing
  wrench: (opts?: IconOptions) => createIcon(
    '<path d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"/>',
    opts
  ),

  water: (opts?: IconOptions) => createIcon(
    '<path d="M12 2.25c-3.75 5.25-6.75 8.25-6.75 11.625a6.75 6.75 0 1013.5 0C18.75 10.5 15.75 7.5 12 2.25z"/>',
    opts
  ),

  fire: (opts?: IconOptions) => createIcon(
    '<path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/><path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z"/>',
    opts
  ),

  emergency: (opts?: IconOptions) => createIcon(
    '<path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>',
    opts
  ),

  shower: (opts?: IconOptions) => createIcon(
    '<path d="M12 2v4m0 0a4 4 0 014 4v1H8v-1a4 4 0 014-4zm-6 9v8m12-8v8m-9-5v5m6-5v5m-3-5v5"/>',
    opts
  ),

  // HVAC
  snowflake: (opts?: IconOptions) => createIcon(
    '<path d="M12 2v20m0-20l4 4m-4-4l-4 4m4 16l4-4m-4 4l-4-4M2 12h20m-20 0l4-4m-4 4l4 4m16-4l-4-4m4 4l-4 4"/>',
    opts
  ),

  wind: (opts?: IconOptions) => createIcon(
    '<path d="M8.25 2.25a2.25 2.25 0 012.25 2.25v.894a2.25 2.25 0 01-.62 1.556l-4.76 5.095a2.25 2.25 0 00-.62 1.556v.894a2.25 2.25 0 002.25 2.25h12M5.25 21h13.5"/>',
    opts
  ),

  // Electrical
  bolt: (opts?: IconOptions) => createIcon(
    '<path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>',
    opts
  ),

  lightBulb: (opts?: IconOptions) => createIcon(
    '<path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>',
    opts
  ),

  plug: (opts?: IconOptions) => createIcon(
    '<path d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"/>',
    opts
  ),

  // Dental/Medical
  tooth: (opts?: IconOptions) => createIcon(
    '<path d="M7 3C5.5 3 4 4.5 4 6.5S5 10 5 12c0 4 1 9 3.5 9s2.5-5 3.5-5 1 5 3.5 5S19 16 19 12c0-2-.5-3.5-.5-5.5S17 3 15.5 3c-1.5 0-2.5 1-3.5 1S8.5 3 7 3z"/>',
    opts
  ),

  heart: (opts?: IconOptions) => createIcon(
    '<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>',
    opts
  ),

  sparkles: (opts?: IconOptions) => createIcon(
    '<path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>',
    opts
  ),

  stethoscope: (opts?: IconOptions) => createIcon(
    '<path d="M5.25 3.75v7.5a6.75 6.75 0 0013.5 0v-7.5M9 3.75v6a3 3 0 106 0v-6M18.75 14.25v3a3.75 3.75 0 01-7.5 0"/>',
    opts
  ),

  // Legal/Professional
  scale: (opts?: IconOptions) => createIcon(
    '<path d="M12 3v18m0-18l-7.5 7.5h15L12 3z"/><path d="M4.5 10.5L2.25 15h4.5l-2.25-4.5zm15 0L17.25 15h4.5l-2.25-4.5z"/>',
    opts
  ),

  briefcase: (opts?: IconOptions) => createIcon(
    '<path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"/>',
    opts
  ),

  document: (opts?: IconOptions) => createIcon(
    '<path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>',
    opts
  ),

  home: (opts?: IconOptions) => createIcon(
    '<path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>',
    opts
  ),

  // Restaurant/Food
  utensils: (opts?: IconOptions) => createIcon(
    '<path d="M6 3v10c0 1.5.5 2 2 2h1v6m0-18v18M14 3v3c0 2 2 3 3 3h1v12"/>',
    opts
  ),

  cake: (opts?: IconOptions) => createIcon(
    '<path d="M12 8.25v-2m0 2c-1.5 0-3 .75-3 2.25v1.5h6v-1.5c0-1.5-1.5-2.25-3-2.25zm-6 6v3.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V14.25M6 14.25h12M12 3v1.5m-4.5 0V6m9-1.5V6"/>',
    opts
  ),

  truck: (opts?: IconOptions) => createIcon(
    '<path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>',
    opts
  ),

  // Fitness
  dumbbell: (opts?: IconOptions) => createIcon(
    '<path d="M3 8h3v8H3zm15 0h3v8h-3zM6 10h2v4H6zm10 0h2v4h-2zM8 11h8v2H8z"/>',
    opts
  ),

  running: (opts?: IconOptions) => createIcon(
    '<path d="M15.5 5.5a2 2 0 100-4 2 2 0 000 4zM5 21l3.5-7 2.5 2 4-5 3.5 5.5M10.5 7.5l-2 3.5 4 3-1 4.5"/>',
    opts
  ),

  // Photography/Creative
  camera: (opts?: IconOptions) => createIcon(
    '<path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>',
    opts
  ),

  image: (opts?: IconOptions) => createIcon(
    '<path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>',
    opts
  ),

  // Landscaping/Outdoor
  tree: (opts?: IconOptions) => createIcon(
    '<path d="M12 21v-6m0 0c-3 0-6-3-6-7 0-2.5 2-5 4-6.5 1-.75 1.5-1 2-1s1 .25 2 1c2 1.5 4 4 4 6.5 0 4-3 7-6 7z"/>',
    opts
  ),

  sun: (opts?: IconOptions) => createIcon(
    '<path d="M12 3v1.5m0 15V21m-7.5-9H3m18 0h-1.5m-2.12-5.38l-1.06 1.06M6.16 17.84l1.06-1.06m0-9.56L6.16 6.16m11.68 11.68l-1.06-1.06M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/>',
    opts
  ),

  // Settings/Maintenance
  cog: (opts?: IconOptions) => createIcon(
    '<path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
    opts
  ),

  tools: (opts?: IconOptions) => createIcon(
    '<path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>',
    opts
  ),

  clipboard: (opts?: IconOptions) => createIcon(
    '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
    opts
  ),

  // Real Estate
  building: (opts?: IconOptions) => createIcon(
    '<path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>',
    opts
  ),

  key: (opts?: IconOptions) => createIcon(
    '<path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>',
    opts
  ),

  users: (opts?: IconOptions) => createIcon(
    '<path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>',
    opts
  ),

  shield: (opts?: IconOptions) => createIcon(
    '<path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>',
    opts
  ),

  award: (opts?: IconOptions) => createIcon(
    '<path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m3.044-1.35a6.726 6.726 0 01-2.748 1.35m0 0a6.772 6.772 0 01-3.044 0"/>',
    opts
  ),
};

/**
 * Service icon mapping by keyword
 * Returns a function that generates the SVG icon
 */
const SERVICE_ICON_MAP: Record<string, keyof typeof icons> = {
  // Plumbing
  drain: 'shower',
  pipe: 'wrench',
  leak: 'water',
  water: 'water',
  heater: 'fire',
  emergency: 'emergency',
  plumb: 'wrench',

  // HVAC
  heating: 'fire',
  cooling: 'snowflake',
  air: 'wind',
  maintenance: 'cog',
  install: 'tools',
  hvac: 'wind',

  // Electrical
  electrical: 'bolt',
  wiring: 'plug',
  panel: 'clipboard',
  lighting: 'lightBulb',
  outlet: 'plug',
  electric: 'bolt',

  // Dental
  teeth: 'tooth',
  cleaning: 'sparkles',
  whitening: 'sparkles',
  implant: 'tooth',
  orthodontics: 'tooth',
  dental: 'tooth',

  // Medical
  exam: 'stethoscope',
  treatment: 'heart',
  therapy: 'heart',
  wellness: 'heart',
  medical: 'stethoscope',
  health: 'heart',

  // Legal
  consultation: 'briefcase',
  litigation: 'scale',
  contract: 'document',
  estate: 'home',
  legal: 'scale',
  law: 'scale',

  // Restaurant
  menu: 'utensils',
  catering: 'cake',
  delivery: 'truck',
  reservation: 'calendar',
  food: 'utensils',
  restaurant: 'utensils',

  // Fitness
  training: 'dumbbell',
  class: 'users',
  cardio: 'running',
  strength: 'dumbbell',
  fitness: 'dumbbell',
  gym: 'dumbbell',

  // Photography
  photo: 'camera',
  portrait: 'camera',
  wedding: 'camera',
  event: 'camera',

  // Landscaping
  lawn: 'tree',
  garden: 'tree',
  landscape: 'tree',
  outdoor: 'sun',

  // Real Estate
  property: 'building',
  realty: 'key',
  realtor: 'home',
  real: 'home',

  // Default
  default: 'star',
};

/**
 * Get icon for a service based on its name
 */
export function getServiceIcon(serviceName: string, options?: IconOptions): string {
  const nameLower = serviceName.toLowerCase();

  for (const [keyword, iconName] of Object.entries(SERVICE_ICON_MAP)) {
    if (nameLower.includes(keyword)) {
      const iconFn = icons[iconName];
      return iconFn ? iconFn(options) : icons.star(options);
    }
  }

  return icons.star(options);
}

/**
 * Convenience function to get the check icon (commonly used for trust badges)
 */
export function getCheckIcon(options?: IconOptions): string {
  return icons.check(options);
}

/**
 * Get image placeholder SVG (for use in about sections, hero images, etc.)
 */
export function getImagePlaceholder(options?: IconOptions): string {
  return icons.image({ ...options, strokeWidth: 1.5 });
}
