// Placeholder atlas. Replace `image` with a real import from
// ../pictures/travel/<region>/ and correct the metadata as photographs land.
// Coordinates are [latitude, longitude] and are what ties a photograph to its
// node on the globe / India plate, so keep them accurate once a photo is real.

export const travelMeta = {
  kicker: "Field Notes",
  title: "Travel",
  intro: "Places, people, and things I stopped long enough to notice."
};

export const travelRegions = [
  {
    id: "international",
    index: "01",
    label: "International",
    note: "Longer stops, wider frames.",
    density: "open"
  },
  {
    id: "india",
    index: "02",
    label: "India",
    note: "Closer to home, closer to the ground.",
    density: "dense"
  }
];

// layout drives the collage cell: span + aspect ratio. See .travel-photo[data-layout].
export const travelPhotos = [
  {
    id: "intl-01",
    region: "international",
    place: "Kyoto",
    country: "Japan",
    date: "March 2026",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [35.0116, 135.7681],
    layout: "wide"
  },
  {
    id: "intl-02",
    region: "international",
    place: "Sendai",
    country: "Japan",
    date: "May 2026",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [38.2682, 140.8694],
    layout: "tall"
  },
  {
    id: "intl-03",
    region: "international",
    place: "Seoul",
    country: "South Korea",
    date: "October 2025",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [37.5665, 126.978],
    layout: "detail"
  },
  {
    id: "intl-04",
    region: "international",
    place: "Vienna",
    country: "Austria",
    date: "June 2026",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [48.2082, 16.3738],
    layout: "pano"
  },
  {
    id: "intl-05",
    region: "international",
    place: "Tokyo",
    country: "Japan",
    date: "April 2026",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [35.6762, 139.6503],
    layout: "square"
  },
  {
    id: "intl-06",
    region: "international",
    place: "Matsushima",
    country: "Japan",
    date: "June 2026",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [38.3739, 141.0603],
    layout: "wide"
  },
  {
    id: "ind-01",
    region: "india",
    place: "Ahmedabad",
    country: "India",
    date: "August 2025",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [23.0225, 72.5714],
    layout: "tall"
  },
  {
    id: "ind-02",
    region: "india",
    place: "Pune",
    country: "India",
    date: "December 2025",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [18.5204, 73.8567],
    layout: "detail"
  },
  {
    id: "ind-03",
    region: "india",
    place: "Siliguri",
    country: "India",
    date: "March 2025",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [26.7271, 88.3953],
    layout: "square"
  },
  {
    id: "ind-04",
    region: "india",
    place: "Guwahati",
    country: "India",
    date: "January 2025",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [26.1445, 91.7362],
    layout: "wide"
  },
  {
    id: "ind-05",
    region: "india",
    place: "Jaipur",
    country: "India",
    date: "February 2025",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [26.9124, 75.7873],
    layout: "detail"
  },
  {
    id: "ind-06",
    region: "india",
    place: "Kochi",
    country: "India",
    date: "November 2024",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [9.9312, 76.2673],
    layout: "square"
  },
  {
    id: "ind-07",
    region: "india",
    place: "Varanasi",
    country: "India",
    date: "October 2024",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [25.3176, 82.9739],
    layout: "tall"
  },
  {
    id: "ind-08",
    region: "india",
    place: "Gandhinagar",
    country: "India",
    date: "July 2024",
    caption: "Placeholder frame — replace with a real photograph.",
    image: null,
    coordinates: [23.2156, 72.6369],
    layout: "pano"
  }
];

// Neutral placeholder legs for the journey rule between the two regions.
export const travelRoute = [
  { id: "leg-01", label: "Waypoint 01", coordinates: [35.6762, 139.6503] },
  { id: "leg-02", label: "Waypoint 02", coordinates: [37.5665, 126.978] },
  { id: "leg-03", label: "Waypoint 03", coordinates: [48.2082, 16.3738] },
  { id: "leg-04", label: "Waypoint 04", coordinates: [38.2682, 140.8694] }
];
