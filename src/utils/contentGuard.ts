
// Simple content guard for profanity and political keywords
const PROFANITY_KEYWORDS = [
    '脏话', 'sb', '操你妈', '你妈的', '傻逼', '他妈的', '死全家', '贱人', '操死你' , '我操你', '混蛋', '狗娘养的', '脑残',
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'motherfucker', 'slut', 'whore', 'cunt', 'retard', 'nigger', 'faggot'
]; 
const POLITICAL_KEYWORDS = [
    '习近平', '李强', '毛泽东', '特朗普', '拜登', '普京', '金正恩', '达赖', '法轮功', '六四', '天安门事件', '台独', '港独', '藏独', '中共', '坦克人', '王毅', '赵立坚', '华春莹', '汪文斌', '孟晚舟', '维尼', '蛤蟆',
    'Xi Jinping', 'Joe Biden', 'Donald Trump', 'Vladimir Putin', 'Kim Jong Un', 'Dalai Lama', 'CCP', 'Tank Man', 'June 4th', 'Taiwan Independence', 'Tibet Independence', 'Uyghur Genocide'
]; 

export function checkContentSafety(text: string): { safe: boolean; reason?: string } {
    if (!text) return { safe: true };

    const lowerText = text.toLowerCase();

    for (const word of PROFANITY_KEYWORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            return { safe: false, reason: '包含敏感词汇' };
        }
    }

    for (const word of POLITICAL_KEYWORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            return { safe: false, reason: '包含敏感政治人物名称' };
        }
    }

    return { safe: true };
}
