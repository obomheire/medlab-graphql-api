export const testData = {
  category: 'Basic Sciences',
  channelName: 'Anatomy Roundtable',
  channelDescription: 'Exploring real-world clinical scenarios.',
  eventName: 'Head and Neck',
  eventDescription: 'A discussion on best practices for managing hypertension.',
  eventOutline: 'Cranial Nerves',
  // "eventOutline": ["Cranial Nerves", "Parotid Gland"],
  episodeTitle: 'Doctor and Patient conversation',
  episodeTopics: ['Cranial Nerves', 'Parotid Gland'],
  actorCount: 4,
  characterDetails: [
    {
      name: 'Dr. Carter',
      role: 'Panelist',
      persona: 'Empathetic and detail-oriented',
      quirks: 'Tends to use analogies',
      catchphrase: 'Let me simplify this for you.',
      expertise: 'Hypertension management',
    },
    {
      name: 'John Doe',
      role: 'Panelist',
      persona: 'Frustrated with current treatment',
      quirks: 'Asks many questions',
      catchphrase: "Why can't this just be fixed?",
      expertise: 'N/A',
    },
    {
      name: 'Dr. Lee',
      role: 'Panelist',
      persona: 'Research-focused and analytical',
      quirks: 'Quotes studies frequently',
      catchphrase: 'Evidence says otherwise.',
      expertise: 'Cardiology',
    },
    {
      name: 'Nurse Kelly',
      role: 'Panelist',
      persona: 'Practical and empathetic',
      quirks: 'Focuses on patient compliance',
      catchphrase: "It's all about consistency.",
      expertise: 'Patient education',
    },
  ],
};
export const testData1 = {
  category: 'Care Conversation',
  channelName: 'Clinical Case Discussions',
  channelDescription: 'Exploring real-world clinical scenarios.',
  eventName: 'Hypertension Management',
  eventDescription: 'A discussion on best practices for managing hypertension.',
  eventOutline: null,
  episodeTitle: 'Doctor and Patient conversation',
  episodeTopics: null,
  actorCount: 4,
  characterDetails: [
    {
      name: 'Dr. Carter',
      role: 'Doctor',
      persona: 'Empathetic and detail-oriented',
      quirks: 'Tends to use analogies',
      catchphrase: 'Let me simplify this for you.',
      expertise: 'Hypertension management',
    },
    {
      name: 'John Doe',
      role: 'Patient',
      persona: 'Frustrated with current treatment',
      quirks: 'Asks many questions',
      catchphrase: "Why can't this just be fixed?",
      expertise: 'N/A',
    },
    {
      name: 'Dr. Lee',
      role: 'Panelist',
      persona: 'Research-focused and analytical',
      quirks: 'Quotes studies frequently',
      catchphrase: 'Evidence says otherwise.',
      expertise: 'Cardiology',
    },
    {
      name: 'Nurse Kelly',
      role: 'Panelist',
      persona: 'Practical and empathetic',
      quirks: 'Focuses on patient compliance',
      catchphrase: "It's all about consistency.",
      expertise: 'Patient education',
    },
  ],
};

export const masterOutline = `{
    "Anatomy Roundtable Outline": {
        "Introduction": {
            "Objective": "Understanding of spatial relationships, anatomical functions, and clinical implications."
        },
        "Head and Neck": {
            "Cranial nerves": "Course, function, and clinical implications.",
            "Muscles of facial expression and mastication": "",
            "Arterial supply": "Carotid arteries, circle of Willis.",
            "Venous drainage": "Dural venous sinuses.",
            "Lymphatic drainage": "Head and neck.",
            "Surgical anatomy": ""
        },
        "Thorax": {
            "Heart": "Chambers, valves, coronary circulation, and conductive system.",
            "Lungs and pleura": "Anatomy and implications in thoracic surgery.",
            "Mediastinum": "Contents and clinical relevance.",
            "Major vessels": "Aorta, pulmonary arteries, and veins.",
            "Nerves": "Phrenic, vagus, and sympathetic trunk.",
            "Surgical approaches": "To the chest."
        },
        "Abdomen": {
            "Gastrointestinal tract": "Relative positions, blood supply, and lymphatic drainage.",
            "Hepatobiliary system": "Liver, gallbladder, pancreas.",
            "Retroperitoneal structures": "Kidneys, adrenal glands, aorta, IVC.",
            "Abdominal wall and inguinal region": "Hernias and surgical anatomy.",
            "Autonomic innervation": "Of the abdomen.",
            "Relevant surgical procedures": ""
        },
        "Pelvis and Perineum": {
            "Pelvic viscera": "Bladder, rectum, uterus, and prostate.",
            "Blood supply and venous drainage": "",
            "Pelvic floor muscles": "And clinical significance.",
            "Nerves": "Pudendal and pelvic splanchnic.",
            "Reproductive organs": "Male and female anatomy.",
            "Surgical relevance": ""
        },
        "Upper Limb": {
            "Brachial plexus": "Anatomy and injuries.",
            "Major muscles": "Shoulder, arm, forearm, and hand.",
            "Arteries": "Subclavian, axillary, brachial, radial, and ulnar.",
            "Veins": "Superficial and deep venous drainage.",
            "Bones and joints": "Fractures and dislocations.",
            "Nerve injuries": "And implications."
        },
        "Lower Limb": {
            "Lumbosacral plexus": "And nerve distribution.",
            "Major muscles": "Hip, thigh, leg, and foot.",
            "Arterial supply": "Femoral, popliteal, and tibial arteries.",
            "Venous drainage": "Superficial (saphenous) and deep veins.",
            "Bones and joints": "Pelvis, femur, tibia, and fibula.",
            "Clinical relevance": ""
        },
        "Spine and Back": {
            "Vertebral column": "Structure, curves, and clinical significance.",
            "Spinal cord and nerve roots": "Anatomy and injuries.",
            "Muscles of the back": "Superficial, intermediate, and deep layers.",
            "Blood supply": "To the spine and spinal cord.",
            "Clinical relevance": ""
        }
    }
  }`;

export const defaultImages = {
  defaultEventImage:
    'https://d1p9fc0i566fiv.cloudfront.net/logo-images/default-event-image.png',
  defaultChannelImage:
    'https://d1p9fc0i566fiv.cloudfront.net/logo-images/default-channel-image.png',
};
