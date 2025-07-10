// db.userentities.updateMany({}, { $unset: { 'clinExSub.isTrial': 1 } });

// db.userentities.updateMany(
//   {},
//   {
//     $set: {
//       'clinExSub.plan': 'starter',
//       'clinExSub.isActive': null,
//       'clinExSub.isTrialPeriod': null,
//       'clinExSub.subCredits': 0,
//       'clinExSub.tokenBalance': 50000,
//       'clinExSub.topUpCredits': 50000,
//       'clinExSub.isTrialLC': true,
//       'clinExSub.isTrialSC': true,
//       stripeClinExCust: null,
//     },
//   },
// );

// db.userentities.updateOne(
//   { email: 'harvinhans128@gmail.com' },
//   {
//     $set: {
//       stripeClinExCust: null,
//     },
//   },
// );

// db.chataiavatarentities.updateMany(
//   {},
//   {
//     $set: { gender: '' },
//   },
// );

// db.userentities.updateOne(
//   { firstName: 'Medscroll' },
//   {
//     $set: {
//       profileImage: '',
//     },
//   },
// );

// function convertSecondsToMinutes(seconds) {
//   const mins = Math.floor(seconds / 60);
//   const secs = (seconds % 60).toFixed(2);
//   return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} seconds`;
// }

// // Example usage:
// const result = convertSecondsToMinutes(5600);
// console.log(result); // "1 minute and 55.30 seconds"

// function convertSecondsToMMSS(seconds) {
//   const mins = Math.floor(seconds / 60);
//   const secs = Math.floor(seconds % 60);
//   const paddedMins = String(mins).padStart(2, '0');
//   const paddedSecs = String(secs).padStart(2, '0');
//   return `${paddedMins}:${paddedSecs}`;
// }

// // Example usage:
// const result = convertSecondsToMMSS(121.50448979591837);
// console.log(result); // "01:55"

// const convertToMMSS = (s) =>
//   [Math.floor(s / 60), Math.floor(s % 60)]
//     .map((unit) => String(unit).padStart(2, '0'))
//     .join(':');

// // Example usage:
// // console.log(convertToMMSS(115.30448979591837)); // "01:55"
// // console.log(convertToMMSS(206.1061224489796)); // "03:26"
// // console.log(convertToMMSS(3600.106122448979)); // "03:26"

// const duration = Math.round(3600.106122448979);
// console.log({ duration, durationType: typeof duration });

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
};

// console.log(formatDuration(undefined));

const eventTemplate = `
# 🧫 Scrubs & Giggles – Episode Template (3 Hosts)

## Episode Format
- **Hosts**: 3 (Moderator + 2 Co-Hosts)
- **Total Duration**: 30 minutes
- **Estimated Word Count**: ~5100 words
- **Style**: Analytical, conversational, system-based
- **Purpose**: To break down key disease mechanisms, diagnostic reasoning, and clinical pathology principles in a structured, accessible, and medically sound way.

**Total Runtime:** 30 minutes

## 🔹 Segment Breakdown

| Segment               | Host(s)         | Duration | Word-Count Target | Purpose                                                                 |
|----------------------|------------------|----------|-------------------|-------------------------------------------------------------------------|
| 1. Introduction      | Moderator (Host 1) | 3 min    | ~500 words        | • Warm welcome
• Show premise & theme
• Quick host banter
• Call for listener stories  |
| 2. Story Block A     | Host 1 + Host 2  | 4 min    | ~800 words        | • Host 1 reads Story #1
• Host 2 reacts & adds anecdote
• All-host banter
• Segue  |
| 3. Story Block B     | Host 2 + Host 3  | 4 min    | ~800 words        | • Host 2 reads Story #2
• Host 3 reacts & adds anecdote
• All-host banter
• Segue  |
| 4. Mid-Show Check-In  | Hosts 1–3       | 2 min    | ~300 words        | • Quick laughs recap
• Tease “halfway” highlight
• Remind to subscribe & send stories  |
| 5. Story Block C     | Host 3 + Host 1  | 4 min    | ~800 words        | • Host 3 reads Story #3
• Host 1 reacts & adds anecdote
• All-host banter
• Segue  |
| 6. Story Block D     | Host 1 + Host 2  | 4 min    | ~800 words        | • Host 1 reads Story #4
• Host 2 reacts & adds anecdote
• All-host banter
• Segue  |
| 7. Rapid-Fire Round   | Hosts 1–3       | 4 min    | ~600 words        | • 3–4 listener one-liner panics
• Quick reactions from each host  |
| 8. Wrap-Up & Outro    | Moderator + Hosts 1–3 | 5 min    | ~1,000 words      | • Reflect on highlights
• Share final anecdotes
• Tease next episode’s theme
• Signature sign-off (“Keep laughing through the chaos!”)  |
`;

const eventTemplate1 = `
# 🧫 Pathology Roundtable – 30-Minute Podcast Template

## Episode Format
- **Hosts**: 3 (Moderator + 2 Co-Hosts)
- **Total Duration**: 30 minutes
- **Estimated Word Count**: ~5100 words
- **Style**: Analytical, conversational, system-based
- **Purpose**: To break down key disease mechanisms, diagnostic reasoning, and clinical pathology principles in a structured, accessible, and medically sound way.

## 🔹 Segment Breakdown

| Segment                              | Duration | Word Count | Focus                                                | Key Elements                                                                                                                                                                                                                          |
|--------------------------------------|----------|------------|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Introduction**                  | 3 min    | ~390 words | Welcome & Topic Framing                             | Moderator welcomes listeners, introduces the episode theme, briefly outlines the topic's relevance in medical education and clinical practice, and previews what listeners will gain from the discussion.                               |
| **2. Disease Mechanisms**            | 4 min    | ~520 words | Pathophysiological Foundation                        | One co-host explains the underlying mechanisms, including the cascade of molecular, cellular, or systemic disruptions involved. Covers origin and progression at a general level.                                                        |
| **3. Structural & Functional Consequences** | 4 min    | ~520 words | Morphological & Physiological Impact                 | Co-hosts discuss how disease processes affect tissue structure and organ function. Emphasizes pathomorphology, histological changes, and clinical implications.                                                                          |
| **4. Clinical Manifestations**       | 4 min    | ~520 words | Signs, Symptoms & Syndromes                         | The team outlines typical presentations and symptom patterns, discussing how pathology translates into clinical findings across stages of disease.                                                                                       |
| **5. Diagnostic Approach**           | 3 min    | ~390 words | Investigations & Interpretation                      | Hosts explore general diagnostic strategies including lab tests, imaging modalities, and pathology investigations used to identify or confirm the disease process.                                                                         |
| **6. Differential Diagnosis & Pitfalls** | 4 min    | ~520 words | Diagnostic Reasoning                                 | The panel discusses how to differentiate the condition from others with overlapping features. Highlights common misdiagnoses and interpretive challenges.                                                                                |
| **7. Management Insights**           | 4 min    | ~520 words | Therapeutic Implications                             | While not treatment-focused, this segment emphasizes how understanding pathology informs clinical decisions, prognosis, and systems-level care strategies.                                                                                |
| **8. Summary & Reflections**         | 4 min    | ~520 words | Key Takeaways & Closing                             | Moderator leads a wrap-up of main ideas, invites each host to share a final insight, and encourages the audience to engage with future episodes or review foundational content.

`;

// const segmentRegex = /^\|\s*(\d+\.\s+.+?)\s*\|/gm;
const segmentRegex = /^\|\s*(?:\*\*)?(\d+\.\s+.+?)(?:\*\*)?\s*\|/gm;
const segments = [];
let match;
while ((match = segmentRegex.exec(eventTemplate)) !== null) {
  segments.push(match[1].trim()); // e.g., "1. Introduction"
}

console.log(segments);

// // Helper function to normalize names
// const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/gi, '');

// console.log(normalize('Dr. Oscar Lindgren'));

const document = {
  _id: {
    $oid: '686bd83d45add6d45a9b587f',
  },
  episodeTitle: 'The Importance of Greetings in Building Rapport',
  description: null,
  fileUrl: null,
  isUploaded: false,
  eventName: 'anatomy',
  episodeTopics: [
    'Understanding the significance of greetings and introductions',
  ],
  threadId: 'thread_gz5yG4bX6pyOyQmJiEAa0H0H',
  episode: '5',
  joinCode: 'Czuq5GVKYSg6iQwI',
  simulation: '# aughing through the chaos! Until next time',
  quiz: [],
  poll: [],
  qa: [],
  comments: [],
  privateChat: [],
  status: 'Queued',
  scheduled: {
    $date: '2025-06-20T11:46:00.000Z',
  },
  scheduledType: 'Never',
  duration: null,
  audioSize: null,
  eventCoverImage: null,
  episodeUUID: '5f4dc1d0-af06-491b-b865-ac53e66048f3',
  createdAt: {
    $date: '2025-07-07T14:22:54.108Z',
  },
  updatedAt: {
    $date: '2025-07-07T17:30:26.072Z',
  },
};

// exports = async function () {
//   const collection = context.services
//     .get('mongodb-atlas')
//     .db('medscroll-develop-db')
//     .collection('chatepisodeentities');

//   const now = new Date();

//   try {
//     await collection.updateMany(
//       {
//         status: 'Queued',
//         scheduled: { $lte: now },
//       },
//       {
//         $set: { status: 'Ongoing' },
//       },
//     );
//   } catch (error) {
//     console.log(
//       'error performing chatepisodeentities status update: ',
//       error.message,
//     );
//   }
// };

exports = async function () {
  const mongodb = context.services.get('Cluster0');
  const collection = mongodb
    .db('medscroll-develop-db')
    .collection('chatepisodeentities');

  try {
    // Single atomic operation: find and update with episodeUUIDs
    const pipeline = [
      { $match: { status: 'Queued', scheduled: { $lte: new Date() } } },
      { $set: { status: 'Ongoing' } },
      { $merge: { into: 'chatepisodeentities', whenMatched: 'replace' } },
    ];

    // Get episodes to update first (for webhook payload)
    const episodesToUpdate = await collection
      .find(
        { status: 'Queued', scheduled: { $lte: new Date() } },
        { projection: { episodeUUID: 1, _id: 0 } },
      )
      .toArray();

    if (episodesToUpdate.length === 0) return { updatedCount: 0 };

    // Update episodes
    const result = await collection.updateMany(
      { status: 'Queued', scheduled: { $lte: new Date() } },
      { $set: { status: 'Ongoing' } },
    );

    // Send webhook only if updates occurred
    if (result.modifiedCount > 0) {
      const episodeUUIDs = episodesToUpdate.map((e) => e.episodeUUID);

      // Fire and forget webhook (don't wait for response)
      context.http
        .post({
          url: 'https://dev-api.medscroll.ai/ongoing-episodes',
          body: JSON.stringify({ episodeUUIDs }),
          headers: { 'Content-Type': 'application/json' },
        })
        .catch((err) => console.log('Webhook error:', err.message));

      return { updatedCount: result.modifiedCount, episodeUUIDs };
    }

    return { updatedCount: 0 };
  } catch (error) {
    console.log('Update error:', error.message);
    return { error: error.message, updatedCount: 0 };
  }
};
