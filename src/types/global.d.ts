declare global {
    interface SectionConfig {
        startTag: `<!--${string}:start-->`;
        endTag: `<!--${string}:end-->`;
        githubName: string;
        max_lines: number;
    };
    
    interface Config {
        activity: SectionConfig
        repository: SectionConfig
        languages: SectionConfig
    }

    interface Delimiters {
        startTag: string;
        endTag: string;
    }

    interface Repository {
        name: string;
        stargazers_count: number;
        html_url: string;
        description?: string;
        language: string;
        languages_url: string;
        created_at: Date;
    }
    
    interface Activities {
        message?: string;
        type: string;
        public: boolean;
        repo: { name: string };
        payload: {
            issue?: { number: number; title: string };
            pull_request?: { number: number; title: string; merged?: boolean };
            comment?: { commit_id: string; html_url: string };
            ref?: string;
            ref_type?: string;
            forkee?: { full_name: string; public: boolean };
            release?: { tag_name: string; html_url: string };
            action?: string;
            size?: number;
        };
        created_at: Date;
    }

    interface Serializer {
        [key: string]: (item: Activities) => string | null;
    }
}

export { };