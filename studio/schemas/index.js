import link from "./objects/link";

import siteSettings from "./siteSettings";
import experience from "./experience";
import education from "./education";
import skill from "./skill";
import project from "./project";
import openSourceContribution from "./openSourceContribution";
import blogPost from "./blogPost";
import publication from "./publication";
import preprint from "./preprint";
import talk from "./talk";
import patent from "./patent";
import certification from "./certification";
import achievement from "./achievement";

export const schemaTypes = [
    // Reusable object types first, so document schemas below can
    // reference `type: 'link'`.
    link,

    siteSettings,
    experience,
    education,
    skill,
    project,
    openSourceContribution,
    blogPost,
    publication,
    preprint,
    talk,
    patent,
    certification,
    achievement,
];
