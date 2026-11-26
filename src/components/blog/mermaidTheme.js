export const getMermaidTheme = (_isDark = false) => {
  const light = {
    background: 'transparent',

    // Process nodes default fill & border
    primaryColor: '#F8FAFC',
    secondaryColor: '#FEF3C7',
    tertiaryColor: '#EFF6FF',
    mainBkg: '#F8FAFC',

    primaryBorderColor: '#1E293B',
    secondaryBorderColor: '#D97706',
    tertiaryBorderColor: '#2563EB',
    nodeBorder: '#1E293B',

    primaryTextColor: '#0F172A',
    secondaryTextColor: '#0F172A',
    tertiaryTextColor: '#334155',
    defaultTextColor: '#0F172A',
    nodeTextColor: '#0F172A',
    titleColor: '#0F172A',

    lineColor: '#475569',
    defaultLinkColor: '#475569',
    signalColor: '#2563EB',
    signalTextColor: '#0F172A',

    edgeLabelBackground: '#FFFFFF',
    labelBoxBkgColor: '#FFFFFF',
    labelBoxBorderColor: '#CBD5E1',
    labelTextColor: '#334155',
    loopTextColor: '#0F172A',

    noteBkgColor: '#FEF3C7',
    noteBorderColor: '#D97706',
    noteTextColor: '#78350F',

    actorBkg: '#F8FAFC',
    actorBorder: '#1E293B',
    actorTextColor: '#0F172A',
    actorLineColor: '#1E293B',
    activationBkgColor: '#EFF6FF',
    activationBorderColor: '#2563EB',
    sequenceNumberColor: '#0F172A',

    clusterBkg: 'rgba(241, 245, 249, 0.65)',
    clusterBorder: '#CBD5E1',

    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '13px',
  };

  return {
    theme: 'base',
    themeVariables: light,
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
      curve: 'basis',
      padding: 16,
      nodeSpacing: 50,
      rankSpacing: 50,
    },
    sequence: {
      useMaxWidth: false,
      showSequenceNumbers: true,
      actorMargin: 40,
      boxMargin: 12,
      boxTextMargin: 6,
      noteMargin: 10,
      messageMargin: 30,
      diagramMarginX: 12,
      diagramMarginY: 12,
    },
    mindmap: {
      useMaxWidth: false,
      padding: 12,
    },
    gantt: {
      useMaxWidth: false,
    },
    journey: {
      useMaxWidth: false,
    },
  };
};

export default getMermaidTheme;
