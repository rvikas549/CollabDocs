// Tiny ProseMirror JSON builders so templates stay readable.
const mark = (m) => (typeof m === 'string' ? { type: m } : m);
const t = (text, marks) => ({ type: 'text', text, ...(marks ? { marks: marks.map(mark) } : {}) });
const b = (text) => t(text, ['bold']);
const i = (text) => t(text, ['italic']);
const hl = (text, color = '#fef08a') => t(text, [{ type: 'highlight', attrs: { color } }]);

// ProseMirror rejects empty text nodes, so blank strings become an empty paragraph.
const p = (...parts) => {
  const content = parts.filter((x) => x !== '' && x != null).map((x) => (typeof x === 'string' ? t(x) : x));
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
};
const h = (level, text) => ({ type: 'heading', attrs: { level }, content: [t(text)] });
const item = (x) => ({ type: 'listItem', content: [typeof x === 'object' && x.type ? x : p(x)] });
const ul = (...items) => ({ type: 'bulletList', content: items.map(item) });
const ol = (...items) => ({ type: 'orderedList', attrs: { start: 1 }, content: items.map(item) });
const todo = (...items) => ({
  type: 'taskList',
  content: items.map((x) => {
    const [text, checked] = Array.isArray(x) ? x : [x, false];
    return { type: 'taskItem', attrs: { checked }, content: [p(text)] };
  }),
});
const quote = (...parts) => ({ type: 'blockquote', content: [p(...parts)] });
const hr = { type: 'horizontalRule' };
const doc = (...content) => ({ type: 'doc', content });

const today = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const TEMPLATES = [
  {
    id: 'meeting',
    name: 'Meeting notes',
    description: 'Agenda, decisions & action items',
    icon: '📝',
    accent: '#6d5efc',
    build: () => ({
      title: `Meeting notes — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      content: doc(
        h(1, 'Meeting notes'),
        p(b('Date: '), today()),
        p(b('Attendees: '), 'Add the people in the room'),
        p(b('Goal: '), i('What should we walk away with?')),
        hr,
        h(2, 'Agenda'),
        ol('Updates since last time', 'Main discussion topic', 'Open questions'),
        h(2, 'Discussion'),
        p('Capture the key points as they come up…'),
        h(2, 'Decisions'),
        ul(p(hl('Decision'), ' — and the reasoning behind it')),
        h(2, 'Action items'),
        todo('Owner — task — due date', 'Share these notes with the team')
      ),
    }),
  },
  {
    id: 'brief',
    name: 'Project brief',
    description: 'Problem, goals & milestones',
    icon: '🚀',
    accent: '#ff5fa2',
    build: () => ({
      title: 'Project brief',
      content: doc(
        h(1, 'Project brief'),
        quote(i('One sentence that explains why this project matters right now.')),
        h(2, 'The problem'),
        p('Who is affected, how often, and what does it cost us today?'),
        h(2, 'Goals'),
        ul('Measurable outcome #1', 'Measurable outcome #2'),
        h(2, 'Non-goals'),
        ul("What we're intentionally not doing"),
        h(2, 'Milestones'),
        todo('Kick-off', 'First prototype', 'Beta testing', 'Launch'),
        h(2, 'Risks & open questions'),
        ul('What could go wrong?', 'What do we still need to learn?')
      ),
    }),
  },
  {
    id: 'weekly',
    name: 'Weekly planner',
    description: 'Priorities & day-by-day tasks',
    icon: '🗓️',
    accent: '#19c3a6',
    build: () => ({
      title: `Week of ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      content: doc(
        h(1, 'This week'),
        h(2, 'Top 3 priorities'),
        ol('The one thing that matters most', 'Second priority', 'Third priority'),
        h(3, 'Monday'),
        todo('Plan the week'),
        h(3, 'Tuesday'),
        todo(''),
        h(3, 'Wednesday'),
        todo(''),
        h(3, 'Thursday'),
        todo(''),
        h(3, 'Friday'),
        todo('Weekly review'),
        h(2, 'Notes & wins'),
        p()
      ),
    }),
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Diverge, then converge',
    icon: '💡',
    accent: '#ffb547',
    build: () => ({
      title: 'Brainstorm',
      content: doc(
        h(1, 'Brainstorm'),
        p(i('Rules: no bad ideas · build on each other · go for quantity.')),
        h(2, 'The question'),
        quote('How might we …?'),
        h(2, 'Wild ideas'),
        ul('Write fast, judge later', 'Anyone can add here — your cursor shows up live'),
        h(2, 'Top picks'),
        ol('…'),
        h(2, 'Next steps'),
        todo('Pick one idea to prototype', 'Decide who owns it')
      ),
    }),
  },
  {
    id: 'blog',
    name: 'Blog post',
    description: 'Hook, story & takeaway',
    icon: '✍️',
    accent: '#3b82f6',
    build: () => ({
      title: 'Untitled blog post',
      content: doc(
        h(1, 'Your headline goes here'),
        p(i('A one-line hook that makes people want to keep reading.')),
        h(2, 'Introduction'),
        p('Set the scene. Why should the reader care?'),
        h(2, 'The main idea'),
        p('Tell the story, share the data, show the example.'),
        quote('A memorable quote or key insight.'),
        h(2, 'Takeaways'),
        ul('Lesson one', 'Lesson two', 'Lesson three'),
        h(2, 'Conclusion'),
        p('Wrap it up and tell readers what to do next.')
      ),
    }),
  },
];
