export type Company = { id: string; name: string; description: string; category: string; people: { name: string; role: string }[] };

export const companies: Company[] = [
  {
    "id": "palantir",
    "name": "Palantir",
    "description": "Military data analysis and AI software",
    "people": [
      {
        "name": "Alex Karp",
        "role": "CEO"
      },
      {
        "name": "Peter Thiel",
        "role": "Key backer"
      },
      {
        "name": "Shyam Shankar",
        "role": "CTO"
      },
      {
        "name": "Stephen Cohen",
        "role": "Co-Founder, President"
      },
      {
        "name": "Ryan Taylor",
        "role": "Chief Revenue & Legal Officer"
      }
    ],
    "category": "Digital systems"
  },
  {
    "id": "lockheed-martin",
    "name": "Lockheed Martin",
    "description": "F-35 aircraft, helicopters, missiles",
    "people": [
      {
        "name": "James D Taiclet",
        "role": "Chairman, President & CEO"
      },
      {
        "name": "Robert Head",
        "role": "Senior VP, Govt. Affairs"
      },
      {
        "name": "Stuart Holiday",
        "role": "SVP, Chief Public Affairs Officer"
      },
      {
        "name": "Frank St. John",
        "role": "COO"
      },
      {
        "name": "Tim Cahill",
        "role": "President & Missiles and Fire Control"
      }
    ],
    "category": "Air & space"
  },
  {
    "id": "boeing",
    "name": "Boeing",
    "description": "F-15 aircraft, aerial refueling, guided munitions",
    "people": [
      {
        "name": "Kelly Ortberg",
        "role": "President & CEO"
      },
      {
        "name": "Jeff Shockey",
        "role": "EVP, Government Operations, Global Public Policy & Corporate Strategy"
      },
      {
        "name": "Steve Parker",
        "role": "President & CEO, Boeing Defense, Space & Security"
      },
      {
        "name": "Jesus “Jay” Malave",
        "role": "EVP & Chief Financial Officer"
      },
      {
        "name": "Steven Mollenkopf",
        "role": "Independent Board Chair"
      }
    ],
    "category": "Air & space"
  },
  {
    "id": "rtx",
    "name": "RTX",
    "description": "Iron Dome interceptors, air-to-air missiles",
    "people": [
      {
        "name": "Christopher T. Calio",
        "role": "Chairman, President & CEO"
      },
      {
        "name": "Art Cameron",
        "role": "Executive VP, Global Government Relations"
      },
      {
        "name": "Philip (Phil) Jasper",
        "role": "President, Raytheon"
      },
      {
        "name": "Robert O. Work",
        "role": "Board Director"
      },
      {
        "name": "Thomas Laliberty",
        "role": "President, Land & Air Defense Systems, Raytheon"
      }
    ],
    "category": "Missiles & munitions"
  },
  {
    "id": "general-dynamics",
    "name": "General Dynamics",
    "description": "Tank ammunition, mortar ammunition",
    "people": [
      {
        "name": "Phebe Novakovic",
        "role": "Chairman & CEO"
      },
      {
        "name": "Danny Deep",
        "role": "President, Incoming CEO"
      },
      {
        "name": "Shane Berg",
        "role": "SVP, External Affairs"
      },
      {
        "name": "Jason Aiken",
        "role": "EVP, Combat and Mission Systems"
      },
      {
        "name": "Douglas Ritter",
        "role": "VP, Government Relations"
      },
      {
        "name": "Erica Striebel",
        "role": "Co-VP of Government Relations"
      },
      {
        "name": "James Mattis",
        "role": "Former U.S. Secretary of Defense and General Dynamics board director"
      },
      {
        "name": "Richard D. Clarke",
        "role": "Board director and former commander of U.S. Special Operations Command"
      }
    ],
    "category": "Land & mobility"
  },
  {
    "id": "northrop-grumman",
    "name": "Northrop Grumman",
    "description": "Aircraft components, ammunition",
    "people": [
      {
        "name": "Kathy Warden",
        "role": "Chair, President & CEO"
      },
      {
        "name": "Krissi Fauser",
        "role": "VP, Legislative Affairs"
      },
      {
        "name": "Stephen O'Bryan",
        "role": "Corporate VP, Global Business Development"
      },
      {
        "name": "Benjamin R. Davies",
        "role": "President, Defense Systems"
      },
      {
        "name": "Christopher W. Grady",
        "role": "Board Director"
      }
    ],
    "category": "Air & space"
  },
  {
    "id": "l3harris-technologies",
    "name": "L3Harris Technologies",
    "description": "ISR aircraft and defense systems",
    "people": [
      {
        "name": "Sam Mehta",
        "role": "President & CEO"
      },
      {
        "name": "Tania Hanna",
        "role": "VP, Government & Customer Relations"
      },
      {
        "name": "Kenneth Bedingfield",
        "role": "President, Missile Solutions"
      },
      {
        "name": "Lauren Barnes",
        "role": "President, Space & Mission Systems"
      },
      {
        "name": "Harry B. Harris Jr.",
        "role": "Board Director"
      }
    ],
    "category": "Air & space"
  },
  {
    "id": "caterpillar",
    "name": "Caterpillar",
    "description": "D9 armored bulldozer platforms",
    "people": [
      {
        "name": "Joseph (Joe) Creed",
        "role": "Chairman & CEO"
      },
      {
        "name": "Kathryn D. Karol",
        "role": "SVP, Global Government & Corporate Affairs"
      },
      {
        "name": "Derek Owens",
        "role": "Chief Legal Officer & General Counsel"
      },
      {
        "name": "Rod Shurman",
        "role": "Group President, Construction Industries"
      },
      {
        "name": "Nazzic Keene",
        "role": "Board Director"
      }
    ],
    "category": "Land & mobility"
  },
  {
    "id": "am-general",
    "name": "AM General",
    "description": "Military tactical vehicles",
    "people": [
      {
        "name": "John P. Chadbourne",
        "role": "President & CEO"
      },
      {
        "name": "Shatiel Edwards",
        "role": "SVP, Chief Growth Officer"
      },
      {
        "name": "Tricia Sherick",
        "role": "EVP, General Counsel"
      },
      {
        "name": "Brian Kuykendall",
        "role": "SVP, Operations"
      },
      {
        "name": "Rita Lei",
        "role": "EVP & Chief Financial Officer"
      }
    ],
    "category": "Land & mobility"
  },
  {
    "id": "rolls-royce-solutions-america",
    "name": "Rolls-Royce Solutions America",
    "description": "Engines and power packs for Namer and Eitan armored vehicles",
    "people": [
      {
        "name": "Jörg Stratmann",
        "role": "CEO, Rolls-Royce Power Systems"
      },
      {
        "name": "Adam Riddle",
        "role": "President, Rolls-Royce Defence; Chairman & CEO, Rolls-Royce North America"
      },
      {
        "name": "Tufan Erginbilgic",
        "role": "CEO, Rolls-Royce Holdings"
      },
      {
        "name": "Martin Thomsen",
        "role": "Chief Procurement and Supply Chain Officer"
      },
      {
        "name": "Helen McCabe",
        "role": "Chief Financial Officer"
      }
    ],
    "category": "Land & mobility"
  },
  {
    "id": "leonardo-helicopters-usa",
    "name": "Leonardo Helicopters USA",
    "description": "AW119Kx military helicopters",
    "people": [
      {
        "name": "Clyde M. Woltman",
        "role": "CEO, Leonardo Helicopters U.S."
      },
      {
        "name": "Stefano Villanti",
        "role": "Managing Director, Leonardo Helicopters Division"
      },
      {
        "name": "Lorenzo Mariani",
        "role": "CEO & General Manager, Leonardo S.p.A."
      },
      {
        "name": "Andrew Gappy",
        "role": "Vice President, Leonardo Helicopters USA"
      },
      {
        "name": "John Broom",
        "role": "Director of Army Programs, Leonardo Helicopters USA"
      }
    ],
    "category": "Air & space"
  },
  {
    "id": "flyer-defense",
    "name": "Flyer Defense",
    "description": "Flyer 72 tactical military vehicles",
    "people": [
      {
        "name": "Oded Nechushtan",
        "role": "Founder & CEO"
      },
      {
        "name": "Amit Nechushtan",
        "role": "Chief Operating Officer"
      },
      {
        "name": "Ariel Ben Dayan",
        "role": "Board Member, Flyer Next"
      },
      {
        "name": "William S. Wallace",
        "role": "Board Member"
      },
      {
        "name": "Bruce Falls",
        "role": "Chief Technology Officer"
      }
    ],
    "category": "Land & mobility"
  },
  {
    "id": "mdt-armor",
    "name": "MDT Armor",
    "description": "David light armored patrol vehicles",
    "people": [
      {
        "name": "Jonathan Whartman",
        "role": "Executive VP, MDT Armor; Former President, Arotech Armor Division"
      },
      {
        "name": "Yosef Bar",
        "role": "Former General Manager, MDT Protective Industries Israel"
      },
      {
        "name": "William Graham",
        "role": "Former VP, Government Affairs, Arotech"
      },
      {
        "name": "Yaakov Har-Oz",
        "role": "Former SVP, General Counsel & Secretary, Arotech"
      },
      {
        "name": "Norman Johnson",
        "role": "Former Controller, Arotech"
      }
    ],
    "category": "Land & mobility"
  },
  {
    "id": "day-zimmermann",
    "name": "Day & Zimmermann",
    "description": "Artillery and tank ammunition manufacturing",
    "people": [
      {
        "name": "Harold L. Yoh III",
        "role": "Chairman & CEO"
      },
      {
        "name": "John J. McGuiness",
        "role": "President, Munitions & Government"
      },
      {
        "name": "Josh Walsh",
        "role": "President, American Ordnance"
      },
      {
        "name": "Mike Yoh",
        "role": "Executive Vice President"
      },
      {
        "name": "Doug Magee",
        "role": "President, Government Services"
      }
    ],
    "category": "Missiles & munitions"
  },
  {
    "id": "leupold-stevens",
    "name": "Leupold & Stevens",
    "description": "Rifle scopes and military optics",
    "people": [
      {
        "name": "Bruce Pettet",
        "role": "President & CEO"
      },
      {
        "name": "Jim Clark",
        "role": "Board Chair"
      },
      {
        "name": "Scott Cain",
        "role": "VP, Global Sales"
      },
      {
        "name": "Tim Lesser",
        "role": "VP, Product Development & Marketing"
      },
      {
        "name": "Rob Nees",
        "role": "VP, Manufacturing & Global Supply Chain"
      }
    ],
    "category": "Optics & sensing"
  },
  {
    "id": "microsoft-msft",
    "name": "Microsoft (MSFT)",
    "description": "Azure, AI, software and professional services supplied to Israel's Ministry of Defense",
    "people": [
      {
        "name": "Satya Nadella",
        "role": "Chairman & CEO"
      },
      {
        "name": "Brad Smith",
        "role": "Vice Chair & President"
      },
      {
        "name": "Judson Althoff",
        "role": "CEO, Microsoft Commercial Business"
      },
      {
        "name": "Scott Guthrie",
        "role": "EVP, Microsoft Cloud + AI Group"
      },
      {
        "name": "Amy Hood",
        "role": "EVP & Chief Financial Officer"
      }
    ],
    "category": "Digital systems"
  },
  {
    "id": "google-googl",
    "name": "Google (GOOGL)",
    "description": "Cloud and AI services under Project Nimbus",
    "people": [
      {
        "name": "Sundar Pichai",
        "role": "CEO, Alphabet & Google"
      },
      {
        "name": "Thomas Kurian",
        "role": "CEO, Google Cloud"
      },
      {
        "name": "Karen Dahut",
        "role": "CEO, Google Public Sector"
      },
      {
        "name": "Karthik Narain",
        "role": "Chief Product & Customer Officer, Google Cloud"
      },
      {
        "name": "Brad Calder",
        "role": "President, Google Cloud Platform & Site Reliability Engineering"
      }
    ],
    "category": "Digital systems"
  },
  {
    "id": "amazon-amzn",
    "name": "Amazon (AMZN)",
    "description": "AWS cloud services under Project Nimbus",
    "people": [
      {
        "name": "Andy Jassy",
        "role": "President & CEO, Amazon"
      },
      {
        "name": "Matt Garman",
        "role": "CEO, Amazon Web Services"
      },
      {
        "name": "Jeff Bezos",
        "role": "Founder & Executive Chair"
      },
      {
        "name": "David Appel",
        "role": "Interim VP, Worldwide Public Sector, AWS (October 2026)"
      },
      {
        "name": "Prasad Kalyanaraman",
        "role": "VP, Infrastructure Services, AWS"
      }
    ],
    "category": "Digital systems"
  },
  {
    "id": "cisco-systems-csco",
    "name": "Cisco Systems (CSCO)",
    "description": "Networking and data-center infrastructure reportedly used by the IDF",
    "people": [
      {
        "name": "Chuck Robbins",
        "role": "Chair & CEO"
      },
      {
        "name": "Jeetu Patel",
        "role": "President & Chief Product Officer"
      },
      {
        "name": "Jeff Campbell",
        "role": "SVP & Chief Government Strategy Officer"
      },
      {
        "name": "Francine Katsoudas",
        "role": "EVP, Chief People, Policy & Purpose Officer"
      },
      {
        "name": "Oliver Tuszik",
        "role": "EVP, Global Sales & Chief Sales Officer"
      }
    ],
    "category": "Digital systems"
  },
  {
    "id": "dell-technologies-dell",
    "name": "Dell Technologies (DELL)",
    "description": "Servers and data-center systems reportedly used by the IDF",
    "people": [
      {
        "name": "Michael Dell",
        "role": "Founder, Chairman & CEO"
      },
      {
        "name": "Jeff Clarke",
        "role": "Vice Chairman & Chief Operating Officer"
      },
      {
        "name": "Arthur Lewis",
        "role": "President, Infrastructure Solutions Group"
      },
      {
        "name": "Bill Scannell",
        "role": "President & Chief Customer Officer"
      },
      {
        "name": "Rich Rothberg",
        "role": "General Counsel"
      }
    ],
    "category": "Digital systems"
  },
  {
    "id": "ibm-red-hat-ibm",
    "name": "IBM / Red Hat (IBM)",
    "description": "Red Hat cloud technologies reportedly provided to the Israeli military",
    "people": [
      {
        "name": "Arvind Krishna",
        "role": "Chairman, President & CEO, IBM"
      },
      {
        "name": "Matt Hicks",
        "role": "President & CEO, Red Hat"
      },
      {
        "name": "Jonathan H. Adashek",
        "role": "SVP & Chief Global Affairs Officer, IBM"
      },
      {
        "name": "Rob Thomas",
        "role": "SVP, Software & Chief Commercial Officer, IBM"
      },
      {
        "name": "Barry Baker",
        "role": "SVP, Infrastructure, IBM"
      }
    ],
    "category": "Digital systems"
  }
];

export const categories = ["Digital systems", "Air & space", "Land & mobility", "Missiles & munitions", "Optics & sensing"];
