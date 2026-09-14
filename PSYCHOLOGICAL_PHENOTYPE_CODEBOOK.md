# Psychological Phenotype Codebook

This codebook captures self-reported psychological experience. It is not a diagnostic instrument. Every field uses `present`, `explicitly_absent`, `uncertain`, or `not_mentioned`; a `present` label requires a de-identified evidence span.

| Field | Operational definition | Inclusion example | Exclusion example | Neighboring concepts to keep separate |
| --- | --- | --- | --- | --- |
| `hopelessness` | Expectation that improvement or a desired future is unavailable. | “Nothing will ever get better.” | “Today feels bad.” | Depressed mood, loss of meaning. |
| `rumination` | Repetitive, difficult-to-stop dwelling on distress or past events. | “I replay every mistake for hours.” | One brief reflection. | Worry, guilt. |
| `anxiety` | Fear, apprehension, or threat-focused arousal. | “I am constantly scared something will go wrong.” | Sadness without fear. | Rumination, irritability. |
| `emotional_numbness` | Blunted or absent felt emotional response. | “I went to a concert and felt nothing.” | Not wanting to attend. | Anhedonia, dissociation. |
| `loneliness` | Felt lack of meaningful connection or companionship. | “I feel alone even around people.” | Choosing solitude without distress. | Social withdrawal, social anxiety. |
| `social_withdrawal` | Reduced social contact or active avoidance of others. | “I stopped replying and stay in my room.” | Feeling lonely while maintaining contact. | Loneliness, fatigue. |
| `irritability` | Heightened anger, annoyance, or low frustration tolerance. | “Everything people do makes me furious.” | Fear or sadness alone. | Anxiety, agitation. |
| `motivation_impairment` | Difficulty initiating an action the author wants or intends to do. | “I want to enjoy things but can’t make myself get out of bed.” | Not valuing the activity. | Anhedonia, fatigue, effort intolerance. |
| `effort_intolerance` | Ordinary tasks feel disproportionately effortful or unsustainable. | “A shower feels like climbing a mountain.” | Simple dislike of a task. | Fatigue, motivation impairment. |
| `self_hatred` | Intense negative self-evaluation, contempt, or hatred toward self. | “I hate myself.” | Regret over one action. | Guilt, worthlessness. |
| `perceived_burdensomeness` | Belief that one’s existence or needs harm or burden others. | “Everyone would be better off without me.” | General low self-esteem. | Self-hatred, suicidality. |
| `loss_of_meaning` | Loss of purpose, significance, or reason to continue valued activity. | “Nothing in my life means anything.” | Temporary boredom. | Hopelessness, anhedonia. |

## Pilot gate

After coding 50–100 posts, compare overlap and reviewer disagreement across fields. If a field is nearly always co-coded with another or cannot be reliably distinguished, merge or remove it before large-scale annotation. Record the decision, evidence, and date in `RESEARCH_PROTOCOL.md`.
