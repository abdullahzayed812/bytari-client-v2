import type { KuNamespace } from './types';

const chat: KuNamespace<'chat'> = {
  common: {
    cancel: 'هەڵوەشاندنەوە',
  },
  list: {
    title: 'گفتوگۆکان',
    loading: 'گفتوگۆکان بار دەکرێن…',
    loadingMore: 'زیاتر بار دەکرێت…',
    count: '{{count}} گفتوگۆ',
    emptyTitle: 'هیچ گفتوگۆیەک نییە',
    emptyMessage: 'گفتوگۆکانت لەگەڵ کلینیک و کێڵگەکان لێرە دەردەکەون.',
    lastActivity: 'دوایین نامە: {{date}}',
    noMessages: 'هێشتا هیچ نامەیەک نییە',
    a11yItem: 'گفتوگۆ',
    a11yUnread: 'گفتوگۆ، {{count}} نامەی نەخوێنراوە',
  },
  thread: {
    title: 'گفتوگۆ',
    notFoundTitle: 'گفتوگۆکە بەردەست نییە',
    notFoundBody: 'لەوانەیە ئەم گفتوگۆیە سڕابێتەوە، یان مۆڵەتی بینینیت نەبێت.',
    back: 'گەڕانەوە',
    noMessages: 'هێشتا هیچ نامەیەک نییە. گفتوگۆکە دەست پێ بکە.',
    deleteTitle: 'سڕینەوەی نامە',
    deleteBody: 'ئەم نامەیە بۆ هەموو بەشداربووان دەسڕدرێتەوە. ناتوانرێت بگەڕێنرێتەوە.',
    deleteConfirm: 'سڕینەوە',
  },
  message: {
    placeholder: 'نامەیەک بنووسە…',
    send: 'ناردن',
    deleted: 'نامەکە سڕایەوە',
    a11yMine: 'نامەکەت: {{body}}',
    a11yTheirs: 'نامە: {{body}}',
    attach: 'هاوپێچ',
    attachTitle: 'هاوپێچ',
    attachPhoto: 'وێنە لە گەلەری',
    attachCamera: 'گرتنی وێنە',
    attachVideo: 'ڤیدیۆ',
    attachFile: 'فایل / بەڵگەنامە',
    attachUploading: 'بارکردن… {{percent}}%',
    attachFailed: 'بارکردنی هاوپێچەکە سەرکەوتوو نەبوو',
    attachRetry: 'دووبارە هەوڵدانەوە',
    attachCancel: 'هەڵوەشاندنەوەی هاوپێچ',
    attachTooLarge: 'قەبارەی فایلەکە لە سنووری ڕێگەپێدراو گەورەترە ({{mb}} مێگابایت).',
    attachPermission: 'تکایە لە ڕێکخستنەکانی ئامێرەکەت مۆڵەت بدە بۆ هاوپێچکردنی میدیا.',
    attachmentImage: 'وێنە',
    attachmentVideo: 'ڤیدیۆ',
    attachmentFile: 'فایل',
    openAttachment: 'کردنەوەی هاوپێچ',
    openFailed: 'نەتوانرا هاوپێچەکە بکرێتەوە.',
  },
  title: {
    unknownPerson: 'بەکارهێنەر',
    unknownOrg: 'دامەزراوە',
  },
  home: {
    title: 'گفتوگۆکان',
    hint: 'پەیوەندی بکە بە کلینیک و کێڵگە پەیوەستەکانت.',
    unread: '{{count}} نەخوێنراوە',
  },
};

export default chat;
