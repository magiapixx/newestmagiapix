// Content of the case-study pages (/cases/<slug>/), in the order they link to each other.
// `props` are passed straight to <CasePage>.

export interface CaseEntry {
  slug: string;
  title: string;
  description: string;
  props: Record<string, any>;
}

export const cases: CaseEntry[] = [
  {
    "slug": "armada",
    "title": "Armada",
    "description": "To align the brand’s long-term strategy with a solid digital concept, we needed to balance ambition with clarity. The challenge was to create a flexible foundation that supports growth while ensuring the messaging remains focused and easy to grasp.",
    "props": {
      "caseStudyDataSrc": "/images/nPXcfgWdT5K8JbvlDs4VQhhws.jpg",
      "caseStudyText": "Armada",
      "caseStudyImage1Image": {
        "src": "/images/tzR8av4WEdW4raKRSK41HYBTKq4.0r68346.jpg",
        "srcset": "/images/tzR8av4WEdW4raKRSK41HYBTKq4.19h35aw.jpg 512w, /images/tzR8av4WEdW4raKRSK41HYBTKq4.0jjpho5.jpg 1024w, /images/tzR8av4WEdW4raKRSK41HYBTKq4.1of4f0m.jpg 2048w, /images/tzR8av4WEdW4raKRSK41HYBTKq4.0r68346.jpg 2816w",
        "width": "2816",
        "height": "1584"
      },
      "caseStudyHasMainInfo": true,
      "caseStudyClient": "Armada Inc.",
      "caseStudyYearDatetime": "2026-04-13T00:00:00.000Z",
      "caseStudyYear": "2026",
      "caseStudyServices": "UI/UX, Framer Development",
      "caseStudyImage2Style": "will-change:transform;height:auto;aspect-ratio:1.776937618147448;opacity:0;transform:none",
      "caseStudyImage2Image": {
        "src": "/images/lpjq84XcIGjKlfR8sTaNO9uQvSA.1gbemsr.jpg",
        "srcset": "/images/lpjq84XcIGjKlfR8sTaNO9uQvSA.0wp6xgh.jpg 512w, /images/lpjq84XcIGjKlfR8sTaNO9uQvSA.1tv0n9g.jpg 1024w, /images/lpjq84XcIGjKlfR8sTaNO9uQvSA.1a5e3or.jpg 2048w, /images/lpjq84XcIGjKlfR8sTaNO9uQvSA.1gbemsr.jpg 3760w",
        "width": "3760",
        "height": "2116"
      },
      "caseStudyImage3Image": {
        "src": "/images/lTVBIixBbnT2OfQ5HUIcCxiXRS0.1gbemsr.jpg",
        "srcset": "/images/lTVBIixBbnT2OfQ5HUIcCxiXRS0.0wp6xgh.jpg 512w, /images/lTVBIixBbnT2OfQ5HUIcCxiXRS0.1tv0n9g.jpg 1024w, /images/lTVBIixBbnT2OfQ5HUIcCxiXRS0.1a5e3or.jpg 2048w, /images/lTVBIixBbnT2OfQ5HUIcCxiXRS0.1gbemsr.jpg 3760w",
        "width": "3760",
        "height": "2116"
      },
      "caseStudyImage4Image": {
        "src": "/images/bnKFX9GuhQqFk9Ymnjepk1kxKA.1gbemsr.jpg",
        "srcset": "/images/bnKFX9GuhQqFk9Ymnjepk1kxKA.0wp6xgh.jpg 512w, /images/bnKFX9GuhQqFk9Ymnjepk1kxKA.1tv0n9g.jpg 1024w, /images/bnKFX9GuhQqFk9Ymnjepk1kxKA.1a5e3or.jpg 2048w, /images/bnKFX9GuhQqFk9Ymnjepk1kxKA.1gbemsr.jpg 3760w",
        "width": "3760",
        "height": "2116"
      },
      "caseStudyHasImages": true,
      "footerSectionAvaImage": {
        "src": "/images/vYl7EJot0JeKsg3JwZOovIuNwb8.1cn48el.jpg"
      },
      "footerSectionLinkWithLineSmallLink": "/contact/"
    }
  },
  {
    "slug": "montana",
    "title": "Montana",
    "description": "To align the brand’s long-term strategy with a solid digital concept, we needed to balance ambition with clarity. The challenge was to create a flexible foundation that supports growth while ensuring the messaging remains focused and easy to grasp.",
    "props": {
      "caseStudyDataSrc": "/images/RFdcBAQsIqs2cwSENiDPQN8xt8.jpg",
      "caseStudyText": "Montana",
      "caseStudyImage1Image": {
        "src": "/images/oYvMZ0HsqBS7GDZLt1iVOY7a0.1bx1hpt.jpg",
        "srcset": "/images/oYvMZ0HsqBS7GDZLt1iVOY7a0.0ziy0vz.jpg 512w, /images/oYvMZ0HsqBS7GDZLt1iVOY7a0.1iriqum.jpg 1024w, /images/oYvMZ0HsqBS7GDZLt1iVOY7a0.0uals1d.jpg 2048w, /images/oYvMZ0HsqBS7GDZLt1iVOY7a0.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasMainInfo": true,
      "caseStudyClient": "DPO Group",
      "caseStudyYearDatetime": "2026-04-13T00:00:00.000Z",
      "caseStudyYear": "2026",
      "caseStudyServices": "Branding, Photo Set",
      "caseStudyImage2Style": "will-change:transform;height:auto;aspect-ratio:1.7777777777777777;opacity:0;transform:none",
      "caseStudyImage2Image": {
        "src": "/images/3mv00D9vdaDkadET8UieiZyIlH0.1bx1hpt.jpg",
        "srcset": "/images/3mv00D9vdaDkadET8UieiZyIlH0.0ziy0vz.jpg 512w, /images/3mv00D9vdaDkadET8UieiZyIlH0.1iriqum.jpg 1024w, /images/3mv00D9vdaDkadET8UieiZyIlH0.0uals1d.jpg 2048w, /images/3mv00D9vdaDkadET8UieiZyIlH0.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage3Image": {
        "src": "/images/RH0NUXGDn4FVDkvceXbvR383Z4.1bx1hpt.jpg",
        "srcset": "/images/RH0NUXGDn4FVDkvceXbvR383Z4.0ziy0vz.jpg 512w, /images/RH0NUXGDn4FVDkvceXbvR383Z4.1iriqum.jpg 1024w, /images/RH0NUXGDn4FVDkvceXbvR383Z4.0uals1d.jpg 2048w, /images/RH0NUXGDn4FVDkvceXbvR383Z4.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage4Image": {
        "src": "/images/yguzxKfcsR21UglTnGnQXrWuF94.1bx1hpt.jpg",
        "srcset": "/images/yguzxKfcsR21UglTnGnQXrWuF94.0ziy0vz.jpg 512w, /images/yguzxKfcsR21UglTnGnQXrWuF94.1iriqum.jpg 1024w, /images/yguzxKfcsR21UglTnGnQXrWuF94.0uals1d.jpg 2048w, /images/yguzxKfcsR21UglTnGnQXrWuF94.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasBlock": true,
      "caseStudyPrevNextLink": "/cases/armada/",
      "caseStudyPrevNextDataSrc": "/images/nPXcfgWdT5K8JbvlDs4VQhhws.jpg",
      "caseStudyPrevNextText": "Armada",
      "caseStudyPrevNextLink2": "/cases/pirate-hub/",
      "caseStudyPrevNextDataSrc2": "/images/bLvotkjf6dFGxyiS1gfV2zCoAI.jpg",
      "caseStudyPrevNextText2": "Pirate Hub",
      "caseStudyHasImages2": true,
      "footerSectionAvaImage": {
        "src": "/images/vYl7EJot0JeKsg3JwZOovIuNwb8.1cn48el.jpg"
      },
      "footerSectionLinkWithLineSmallLink": "/contact/"
    }
  },
  {
    "slug": "pirate-hub",
    "title": "Pirate Hub",
    "description": "To align the brand’s long-term strategy with a solid digital concept, we needed to balance ambition with clarity. The challenge was to create a flexible foundation that supports growth while ensuring the messaging remains focused and easy to grasp.",
    "props": {
      "caseStudyDataSrc": "/images/bLvotkjf6dFGxyiS1gfV2zCoAI.jpg",
      "caseStudyText": "Pirate Hub",
      "caseStudyImage1Image": {
        "src": "/images/10HAAOfbmO0qIphgvN16WnGTFzY.1bx1hpt.jpg",
        "srcset": "/images/10HAAOfbmO0qIphgvN16WnGTFzY.0ziy0vz.jpg 512w, /images/10HAAOfbmO0qIphgvN16WnGTFzY.1iriqum.jpg 1024w, /images/10HAAOfbmO0qIphgvN16WnGTFzY.0uals1d.jpg 2048w, /images/10HAAOfbmO0qIphgvN16WnGTFzY.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasMainInfo": true,
      "caseStudyClient": "MegaDownload Inc.",
      "caseStudyYearDatetime": "2026-04-13T00:00:00.000Z",
      "caseStudyYear": "2026",
      "caseStudyServices": "Branding, Webdesign",
      "caseStudyImage2Style": "will-change:transform;height:auto;aspect-ratio:1.7777777777777777;opacity:0;transform:none",
      "caseStudyImage2Image": {
        "src": "/images/6Mu9G0NMqE3n3rgtpmrGOZRVwY.1bx1hpt.jpg",
        "srcset": "/images/6Mu9G0NMqE3n3rgtpmrGOZRVwY.0ziy0vz.jpg 512w, /images/6Mu9G0NMqE3n3rgtpmrGOZRVwY.1iriqum.jpg 1024w, /images/6Mu9G0NMqE3n3rgtpmrGOZRVwY.0uals1d.jpg 2048w, /images/6Mu9G0NMqE3n3rgtpmrGOZRVwY.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage3Image": {
        "src": "/images/ePiJ17Xw2KjAC3zQsMzArNAzS3M.1bx1hpt.jpg",
        "srcset": "/images/ePiJ17Xw2KjAC3zQsMzArNAzS3M.0ziy0vz.jpg 512w, /images/ePiJ17Xw2KjAC3zQsMzArNAzS3M.1iriqum.jpg 1024w, /images/ePiJ17Xw2KjAC3zQsMzArNAzS3M.0uals1d.jpg 2048w, /images/ePiJ17Xw2KjAC3zQsMzArNAzS3M.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage4Image": {
        "src": "/images/6e5blb6NuC2hejS2aTDrfvy9w.1bx1hpt.jpg",
        "srcset": "/images/6e5blb6NuC2hejS2aTDrfvy9w.0ziy0vz.jpg 512w, /images/6e5blb6NuC2hejS2aTDrfvy9w.1iriqum.jpg 1024w, /images/6e5blb6NuC2hejS2aTDrfvy9w.0uals1d.jpg 2048w, /images/6e5blb6NuC2hejS2aTDrfvy9w.1bx1hpt.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasBlock": true,
      "caseStudyPrevNextLink": "/cases/montana/",
      "caseStudyPrevNextDataSrc": "/images/RFdcBAQsIqs2cwSENiDPQN8xt8.jpg",
      "caseStudyPrevNextText": "Montana",
      "caseStudyPrevNextLink2": "/cases/calderone/",
      "caseStudyPrevNextDataSrc2": "/images/4zmvB84YdDqvaIgOFHPAk2SGOXI.jpg",
      "caseStudyPrevNextText2": "Calderone",
      "caseStudyHasImages2": true,
      "footerSectionAvaImage": {
        "src": "/images/vYl7EJot0JeKsg3JwZOovIuNwb8.1cn48el.jpg"
      },
      "footerSectionLinkWithLineSmallLink": "/contact/"
    }
  },
  {
    "slug": "calderone",
    "title": "Calderone",
    "description": "To align the brand’s long-term strategy with a solid digital concept, we needed to balance ambition with clarity. The challenge was to create a flexible foundation that supports growth while ensuring the messaging remains focused and easy to grasp.",
    "props": {
      "caseStudyDataSrc": "/images/4zmvB84YdDqvaIgOFHPAk2SGOXI.jpg",
      "caseStudyText": "Calderone",
      "caseStudyImage1Image": {
        "src": "/images/bQ8EmseJK8m00dlpL4XnJsIZyDc.__q4575607247.jpg",
        "srcset": "/images/bQ8EmseJK8m00dlpL4XnJsIZyDc.__q1fd7ef867e.jpg 512w, /images/bQ8EmseJK8m00dlpL4XnJsIZyDc.__q0902eb1338.jpg 1024w, /images/bQ8EmseJK8m00dlpL4XnJsIZyDc.__q709c56c11a.jpg 2048w, /images/bQ8EmseJK8m00dlpL4XnJsIZyDc.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasMainInfo": true,
      "caseStudyClient": "Calderone Inc.",
      "caseStudyYearDatetime": "2025-04-13T00:00:00.000Z",
      "caseStudyYear": "2025",
      "caseStudyServices": "3D Modeling, 3D Rendering",
      "caseStudyImage2Style": "will-change:transform;height:auto;aspect-ratio:1.7777777777777777;opacity:0;transform:none",
      "caseStudyImage2Image": {
        "src": "/images/yLmXMJTKwBlAkuQZNikF07lIY.__q4575607247.jpg",
        "srcset": "/images/yLmXMJTKwBlAkuQZNikF07lIY.__q1fd7ef867e.jpg 512w, /images/yLmXMJTKwBlAkuQZNikF07lIY.__q0902eb1338.jpg 1024w, /images/yLmXMJTKwBlAkuQZNikF07lIY.__q709c56c11a.jpg 2048w, /images/yLmXMJTKwBlAkuQZNikF07lIY.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage3Image": {
        "src": "/images/mu6E6GcTGsh8fWAfR0u4ftfFrio.__q4575607247.jpg",
        "srcset": "/images/mu6E6GcTGsh8fWAfR0u4ftfFrio.__q1fd7ef867e.jpg 512w, /images/mu6E6GcTGsh8fWAfR0u4ftfFrio.__q0902eb1338.jpg 1024w, /images/mu6E6GcTGsh8fWAfR0u4ftfFrio.__q709c56c11a.jpg 2048w, /images/mu6E6GcTGsh8fWAfR0u4ftfFrio.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage4Image": {
        "src": "/images/XK7QWi4Ph6pJ4OlJPm8eS8l3tU.__q4575607247.jpg",
        "srcset": "/images/XK7QWi4Ph6pJ4OlJPm8eS8l3tU.__q1fd7ef867e.jpg 512w, /images/XK7QWi4Ph6pJ4OlJPm8eS8l3tU.__q0902eb1338.jpg 1024w, /images/XK7QWi4Ph6pJ4OlJPm8eS8l3tU.__q709c56c11a.jpg 2048w, /images/XK7QWi4Ph6pJ4OlJPm8eS8l3tU.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasBlock": true,
      "caseStudyPrevNextLink": "/cases/pirate-hub/",
      "caseStudyPrevNextDataSrc": "/images/bLvotkjf6dFGxyiS1gfV2zCoAI.jpg",
      "caseStudyPrevNextText": "Pirate Hub",
      "caseStudyPrevNextLink2": "/cases/oasis/",
      "caseStudyPrevNextDataSrc2": "/images/rAJGys7D5In5EzOU3L5miGh8ks.jpg",
      "caseStudyPrevNextText2": "Oasis",
      "caseStudyHasImages2": true,
      "footerSectionAvaImage": {
        "src": "/images/vYl7EJot0JeKsg3JwZOovIuNwb8.__q31ceee86a7.jpg"
      },
      "footerSectionLinkWithLineSmallLink": "/contact/#contact"
    }
  },
  {
    "slug": "oasis",
    "title": "Oasis",
    "description": "To align the brand’s long-term strategy with a solid digital concept, we needed to balance ambition with clarity. The challenge was to create a flexible foundation that supports growth while ensuring the messaging remains focused and easy to grasp.",
    "props": {
      "caseStudyDataSrc": "/images/rAJGys7D5In5EzOU3L5miGh8ks.jpg",
      "caseStudyText": "Oasis",
      "caseStudyImage1Image": {
        "src": "/images/QlvUvHNwojLZJxCdE1mIvzEkoy0.__q4575607247.jpg",
        "srcset": "/images/QlvUvHNwojLZJxCdE1mIvzEkoy0.__q1fd7ef867e.jpg 512w, /images/QlvUvHNwojLZJxCdE1mIvzEkoy0.__q0902eb1338.jpg 1024w, /images/QlvUvHNwojLZJxCdE1mIvzEkoy0.__q709c56c11a.jpg 2048w, /images/QlvUvHNwojLZJxCdE1mIvzEkoy0.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyClient": "Oasis Inc.",
      "caseStudyYearDatetime": "2025-04-13T00:00:00.000Z",
      "caseStudyYear": "2025",
      "caseStudyServices": "Architecture Design, 3D Rendering",
      "caseStudyImage2Style": "will-change:transform;height:auto;aspect-ratio:1.7777777777777777;opacity:0;transform:none",
      "caseStudyImage2Image": {
        "src": "/images/lE30YV53LtCWYL589AibqOftLpY.__q4575607247.jpg",
        "srcset": "/images/lE30YV53LtCWYL589AibqOftLpY.__q1fd7ef867e.jpg 512w, /images/lE30YV53LtCWYL589AibqOftLpY.__q0902eb1338.jpg 1024w, /images/lE30YV53LtCWYL589AibqOftLpY.__q709c56c11a.jpg 2048w, /images/lE30YV53LtCWYL589AibqOftLpY.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage3Image": {
        "src": "/images/xMBnLRmWdgugPY19yil56TQGx4.__q4575607247.jpg",
        "srcset": "/images/xMBnLRmWdgugPY19yil56TQGx4.__q1fd7ef867e.jpg 512w, /images/xMBnLRmWdgugPY19yil56TQGx4.__q0902eb1338.jpg 1024w, /images/xMBnLRmWdgugPY19yil56TQGx4.__q709c56c11a.jpg 2048w, /images/xMBnLRmWdgugPY19yil56TQGx4.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyImage4Image": {
        "src": "/images/2eiGhed77rMxCNYLFfDNC7wxw.__q4575607247.jpg",
        "srcset": "/images/2eiGhed77rMxCNYLFfDNC7wxw.__q1fd7ef867e.jpg 512w, /images/2eiGhed77rMxCNYLFfDNC7wxw.__q0902eb1338.jpg 1024w, /images/2eiGhed77rMxCNYLFfDNC7wxw.__q709c56c11a.jpg 2048w, /images/2eiGhed77rMxCNYLFfDNC7wxw.__q4575607247.jpg 3840w",
        "width": "3840",
        "height": "2160"
      },
      "caseStudyHasBlock": true,
      "caseStudyPrevNextLink": "/cases/calderone/",
      "caseStudyPrevNextDataSrc": "/images/4zmvB84YdDqvaIgOFHPAk2SGOXI.jpg",
      "caseStudyPrevNextText": "Calderone",
      "caseStudyMainInfoClass": "hide-desktop hide-phone",
      "footerSectionAvaImage": {
        "src": "/images/vYl7EJot0JeKsg3JwZOovIuNwb8.__q31ceee86a7.jpg"
      },
      "footerSectionLinkWithLineSmallLink": "/contact/#contact"
    }
  }
];
