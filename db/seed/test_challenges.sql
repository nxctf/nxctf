-- ==============================================
-- Test Events & Challenges Seed Data
-- Generated for testing purpose
-- ==============================================

-- Test Events
INSERT INTO public.events (id, name, description, join_mode, start_time, end_time)
VALUES ('9165b1c7-c72b-491d-81f6-887257c14ebe', 'NXCTF Public Qualifier', 'Event kualifikasi publik untuk semua peserta.', 'open', now(), now() + interval '7 days');
INSERT INTO public.events (id, name, description, join_mode, join_key, start_time, end_time)
VALUES ('e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85', 'NXCTF Private Finals', 'Event final tertutup khusus undangan.', 'key', 'secret-key-123', now() + interval '14 days', now() + interval '21 days');

-- Category: Intro
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'a970c50b-1231-4a88-8aff-8ed24998716c',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Intro Challenge #1',
    'This is a comprehensive test challenge for the Intro category.

Difficulty: Baby
Points: 20
Category: Intro

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{intro_test_1_9d89}`',
    'Intro',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('a970c50b-1231-4a88-8aff-8ed24998716c', 'NXCTF{intro_test_1_9d89}', 'ec868e712fceeab885a34db491cc86f67726c1de8229a8f6478988141e3d1798');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'd58f52f9-1a3f-4f59-8db1-dcec9d171adb',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Intro Challenge #2',
    'This is a comprehensive test challenge for the Intro category.

Difficulty: Easy
Points: 40
Category: Intro

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{intro_test_2_f226}`',
    'Intro',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Intro Challenge #2","Cobalah telusuri lebih dalam di Intro"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('d58f52f9-1a3f-4f59-8db1-dcec9d171adb', 'NXCTF{intro_test_2_f226}', 'edad9b1a4f307243bbd5551f0031a5fc6e8a64961693b6b1159e2634d4d7a6a3');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '81150592-d82e-45db-8537-cf1d1526b463',
    NULL,
    'Intro Challenge #3',
    'This is a comprehensive test challenge for the Intro category.

Difficulty: Medium
Points: 60
Category: Intro

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{intro_test_3_a45a}`',
    'Intro',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('81150592-d82e-45db-8537-cf1d1526b463', 'NXCTF{intro_test_3_a45a}', 'aeda0d78051e21ac68cad520b530d36298e1e84fc74495c078bbd48a1a0ac9bf');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'aac71b10-6ddf-4c98-8b2b-29aeed5cd2db',
    NULL,
    'Intro Challenge #4',
    'This is a comprehensive test challenge for the Intro category.

Difficulty: Hard
Points: 80
Category: Intro

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{intro_test_4_1f16}`',
    'Intro',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Intro Challenge #4","Cobalah telusuri lebih dalam di Intro"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('aac71b10-6ddf-4c98-8b2b-29aeed5cd2db', 'NXCTF{intro_test_4_1f16}', '36be0bfd67253e43346daab76d7e9e145a67609548296c6bf04943c1ed874b07');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'ba976995-9319-4045-8699-16b6b933e6c0',
    NULL,
    'Intro Challenge #5',
    'This is a comprehensive test challenge for the Intro category.

Difficulty: Insane
Points: 100
Category: Intro

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{intro_test_5_f661}`',
    'Intro',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('ba976995-9319-4045-8699-16b6b933e6c0', 'NXCTF{intro_test_5_f661}', '753e629927651cb959aa7fcb35c6b0a4f28c5ddf844d917eabb25356d391a155');

-- Category: Boot To Root
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'eaeff961-c0c3-4186-a267-2cfe6c3383cc',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Boot To Root Challenge #1',
    'This is a comprehensive test challenge for the Boot To Root category.

Difficulty: Baby
Points: 20
Category: Boot To Root

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{boot_to_root_test_1_4190}`',
    'Boot To Root',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('eaeff961-c0c3-4186-a267-2cfe6c3383cc', 'NXCTF{boot_to_root_test_1_4190}', '6607db3d19a625ec80a346d9ae22076b67ea9ec046a8e71c3c57c36e7b8703b6');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '4c5c970b-883e-4b76-a2b1-f7178674cd0f',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Boot To Root Challenge #2',
    'This is a comprehensive test challenge for the Boot To Root category.

Difficulty: Easy
Points: 40
Category: Boot To Root

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{boot_to_root_test_2_92b8}`',
    'Boot To Root',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Boot To Root Challenge #2","Cobalah telusuri lebih dalam di Boot To Root"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('4c5c970b-883e-4b76-a2b1-f7178674cd0f', 'NXCTF{boot_to_root_test_2_92b8}', '26ae0d0921d183d9f2c2c18005791a718ba62dd586d1a746823913c9f5ffae09');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'aa069355-3c9c-441f-a697-2823567eede5',
    NULL,
    'Boot To Root Challenge #3',
    'This is a comprehensive test challenge for the Boot To Root category.

Difficulty: Medium
Points: 60
Category: Boot To Root

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{boot_to_root_test_3_e96e}`',
    'Boot To Root',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('aa069355-3c9c-441f-a697-2823567eede5', 'NXCTF{boot_to_root_test_3_e96e}', '1d39ed7ed38fbc2e2830a9b3dfedda5774fe34ca8f67aeadc570e0ace7d04a77');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'd0a3a6e3-ab86-4d2f-a594-66726462db92',
    NULL,
    'Boot To Root Challenge #4',
    'This is a comprehensive test challenge for the Boot To Root category.

Difficulty: Hard
Points: 80
Category: Boot To Root

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{boot_to_root_test_4_13e2}`',
    'Boot To Root',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Boot To Root Challenge #4","Cobalah telusuri lebih dalam di Boot To Root"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('d0a3a6e3-ab86-4d2f-a594-66726462db92', 'NXCTF{boot_to_root_test_4_13e2}', '365b9b774edd576fc214fbbabcbe7e9b484448608730d779817f07c4a22f2578');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'aa8fa198-4a60-4788-a519-dfe237db6951',
    NULL,
    'Boot To Root Challenge #5',
    'This is a comprehensive test challenge for the Boot To Root category.

Difficulty: Insane
Points: 100
Category: Boot To Root

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{boot_to_root_test_5_ca26}`',
    'Boot To Root',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('aa8fa198-4a60-4788-a519-dfe237db6951', 'NXCTF{boot_to_root_test_5_ca26}', '541ba1cd1eb76e973152849f9e26c3d0cdaec3fe8d62c714e01c1f8a15e1188b');

-- Category: Web
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'ba7719ee-ecf3-465d-b514-0b432f43bf45',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Web Challenge #1',
    'This is a comprehensive test challenge for the Web category.

Difficulty: Baby
Points: 20
Category: Web

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{web_test_1_be2b}`',
    'Web',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('ba7719ee-ecf3-465d-b514-0b432f43bf45', 'NXCTF{web_test_1_be2b}', '6c2e1b534129881bd432e7f33ec4831a7cad3cad4314b794f6616cc800dd359d');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '87462950-3091-41c2-90ee-7cdad067eb01',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Web Challenge #2',
    'This is a comprehensive test challenge for the Web category.

Difficulty: Easy
Points: 40
Category: Web

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{web_test_2_f2dd}`',
    'Web',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Web Challenge #2","Cobalah telusuri lebih dalam di Web"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('87462950-3091-41c2-90ee-7cdad067eb01', 'NXCTF{web_test_2_f2dd}', '21997ad0f6ffb60b1e3d73933cf72d8b6313546fc6a6aa36aeccdc6c52d49e2c');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '4e688ac5-686d-40fa-809a-fc73ca49c3a4',
    NULL,
    'Web Challenge #3',
    'This is a comprehensive test challenge for the Web category.

Difficulty: Medium
Points: 60
Category: Web

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{web_test_3_07a6}`',
    'Web',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('4e688ac5-686d-40fa-809a-fc73ca49c3a4', 'NXCTF{web_test_3_07a6}', '47af5a913b0b74b4cd6092e9301c0e2390e0a0811aee3f4d4e3e69e734fa8821');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '5014cae2-cf7f-4eb6-8080-214bd467eff5',
    NULL,
    'Web Challenge #4',
    'This is a comprehensive test challenge for the Web category.

Difficulty: Hard
Points: 80
Category: Web

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{web_test_4_faf8}`',
    'Web',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Web Challenge #4","Cobalah telusuri lebih dalam di Web"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('5014cae2-cf7f-4eb6-8080-214bd467eff5', 'NXCTF{web_test_4_faf8}', '73c1dcc56ebe2094589dc4a0b1671b0faca4b4520167684654ab84ebb2dc11ed');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '976ecf48-6de5-4e89-af85-be55a842bcb4',
    NULL,
    'Web Challenge #5',
    'This is a comprehensive test challenge for the Web category.

Difficulty: Insane
Points: 100
Category: Web

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{web_test_5_fb24}`',
    'Web',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('976ecf48-6de5-4e89-af85-be55a842bcb4', 'NXCTF{web_test_5_fb24}', '1b502f26b799df1b0b3c105502af3a7146dde00a272dad6cf1994f7e328f9f95');

-- Category: Forensics
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '128fa7e8-1fe8-49b9-be50-57018987b8ff',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Forensics Challenge #1',
    'This is a comprehensive test challenge for the Forensics category.

Difficulty: Baby
Points: 20
Category: Forensics

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{forensics_test_1_9df8}`',
    'Forensics',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('128fa7e8-1fe8-49b9-be50-57018987b8ff', 'NXCTF{forensics_test_1_9df8}', 'a018e1c670bc160b8593cbc3ef5a8b1f5ecec48c6de614a8911c5fdfcd19e774');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'f38bffea-0321-414e-b455-a7594eae4494',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Forensics Challenge #2',
    'This is a comprehensive test challenge for the Forensics category.

Difficulty: Easy
Points: 40
Category: Forensics

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{forensics_test_2_0485}`',
    'Forensics',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Forensics Challenge #2","Cobalah telusuri lebih dalam di Forensics"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('f38bffea-0321-414e-b455-a7594eae4494', 'NXCTF{forensics_test_2_0485}', '2485cf8a5493a43388200a2a7e65078e594d71a59153371560139eb7c485c67e');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '955156f3-b608-403f-b7ac-666a315275ec',
    NULL,
    'Forensics Challenge #3',
    'This is a comprehensive test challenge for the Forensics category.

Difficulty: Medium
Points: 60
Category: Forensics

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{forensics_test_3_b05b}`',
    'Forensics',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('955156f3-b608-403f-b7ac-666a315275ec', 'NXCTF{forensics_test_3_b05b}', 'e6b2336fb17aa32d1fd2b80d192d7bac0f32f06eb82e300488b1fb46e0c366fb');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '86b4545a-9dc5-4d58-8555-d06304d2f963',
    NULL,
    'Forensics Challenge #4',
    'This is a comprehensive test challenge for the Forensics category.

Difficulty: Hard
Points: 80
Category: Forensics

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{forensics_test_4_0c5a}`',
    'Forensics',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Forensics Challenge #4","Cobalah telusuri lebih dalam di Forensics"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('86b4545a-9dc5-4d58-8555-d06304d2f963', 'NXCTF{forensics_test_4_0c5a}', 'ef98f9c1a8b0a1e1a8da18c0e9fb39d28ba9936907490244f4357c912c668b53');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '65551a8e-714e-4d15-90c7-c6d6f7b7b982',
    NULL,
    'Forensics Challenge #5',
    'This is a comprehensive test challenge for the Forensics category.

Difficulty: Insane
Points: 100
Category: Forensics

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{forensics_test_5_f40b}`',
    'Forensics',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('65551a8e-714e-4d15-90c7-c6d6f7b7b982', 'NXCTF{forensics_test_5_f40b}', 'c8fb01cb5618f9679afee7807415086371fa2d9f879fc9a6e67683fc52b551ba');

-- Category: AI
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '94a1979c-70dc-45a9-a0fd-2bb120b3c1f0',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'AI Challenge #1',
    'This is a comprehensive test challenge for the AI category.

Difficulty: Baby
Points: 20
Category: AI

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{ai_test_1_c504}`',
    'AI',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('94a1979c-70dc-45a9-a0fd-2bb120b3c1f0', 'NXCTF{ai_test_1_c504}', '2aee5a1a6e69a5db2817faf3c100c12c17f983e6ffebb4416409b2ff56424e36');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'e99e44cc-3061-4cc8-92f2-29fd3d12a971',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'AI Challenge #2',
    'This is a comprehensive test challenge for the AI category.

Difficulty: Easy
Points: 40
Category: AI

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{ai_test_2_0a53}`',
    'AI',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal AI Challenge #2","Cobalah telusuri lebih dalam di AI"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('e99e44cc-3061-4cc8-92f2-29fd3d12a971', 'NXCTF{ai_test_2_0a53}', '550762dd04da5c2e57d0ee046bed2d18e6568eb94eb9967e0567074186cf5df5');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '3e5a7dbf-c27f-4a31-a2e0-7a7f99c292c0',
    NULL,
    'AI Challenge #3',
    'This is a comprehensive test challenge for the AI category.

Difficulty: Medium
Points: 60
Category: AI

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{ai_test_3_f82b}`',
    'AI',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('3e5a7dbf-c27f-4a31-a2e0-7a7f99c292c0', 'NXCTF{ai_test_3_f82b}', 'a7f65065f8d23eaf72c0bac666fbce4779d5197027e226c91d6e27323cc91ed8');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '805a948d-0b29-47ab-bdf5-374f6329f9ce',
    NULL,
    'AI Challenge #4',
    'This is a comprehensive test challenge for the AI category.

Difficulty: Hard
Points: 80
Category: AI

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{ai_test_4_1f87}`',
    'AI',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal AI Challenge #4","Cobalah telusuri lebih dalam di AI"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('805a948d-0b29-47ab-bdf5-374f6329f9ce', 'NXCTF{ai_test_4_1f87}', '06d1eab947934bb22dfd901b622fb618516893eddc51baf0d87732ccbad191d3');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '6de25660-b502-410a-9499-a5040e9e7792',
    NULL,
    'AI Challenge #5',
    'This is a comprehensive test challenge for the AI category.

Difficulty: Insane
Points: 100
Category: AI

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{ai_test_5_0e16}`',
    'AI',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('6de25660-b502-410a-9499-a5040e9e7792', 'NXCTF{ai_test_5_0e16}', 'd5c08b50770b4f17c5b01d3012a37549d94110cc9469357c0b6ad747d5625a48');

-- Category: Osint
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '15b00a86-13de-46f0-9d2e-5c9cad029228',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Osint Challenge #1',
    'This is a comprehensive test challenge for the Osint category.

Difficulty: Baby
Points: 20
Category: Osint

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{osint_test_1_1ac8}`',
    'Osint',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('15b00a86-13de-46f0-9d2e-5c9cad029228', 'NXCTF{osint_test_1_1ac8}', '33a13282ba7b6fbac0125767abadca14e463d4de482bc56f8586739eec70bfad');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '85aa4e0b-4816-42b1-9cd6-b86af789dd71',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Osint Challenge #2',
    'This is a comprehensive test challenge for the Osint category.

Difficulty: Easy
Points: 40
Category: Osint

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{osint_test_2_6e05}`',
    'Osint',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Osint Challenge #2","Cobalah telusuri lebih dalam di Osint"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('85aa4e0b-4816-42b1-9cd6-b86af789dd71', 'NXCTF{osint_test_2_6e05}', '5048674e0abde2e4b84b7d7bc8c25c04a91a1c3a860a2a7e13f935eab066d473');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'c7ece9eb-70f4-43ed-b17c-a14eba4a18bc',
    NULL,
    'Osint Challenge #3',
    'This is a comprehensive test challenge for the Osint category.

Difficulty: Medium
Points: 60
Category: Osint

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{osint_test_3_9267}`',
    'Osint',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('c7ece9eb-70f4-43ed-b17c-a14eba4a18bc', 'NXCTF{osint_test_3_9267}', '4f6c2ae90cc67ad29d4f3139280e6652d231a3072571d2911ce34d1a88f2d755');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'dd1424fb-03f9-4865-bae2-13959f38721e',
    NULL,
    'Osint Challenge #4',
    'This is a comprehensive test challenge for the Osint category.

Difficulty: Hard
Points: 80
Category: Osint

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{osint_test_4_6341}`',
    'Osint',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Osint Challenge #4","Cobalah telusuri lebih dalam di Osint"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('dd1424fb-03f9-4865-bae2-13959f38721e', 'NXCTF{osint_test_4_6341}', '81695bf4ef5d641d70c76e9d8b7631e7b890aa0643d71c9abcfd8b3c7dc46cd9');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '99017625-adb4-40a2-b064-00a338d9ade7',
    NULL,
    'Osint Challenge #5',
    'This is a comprehensive test challenge for the Osint category.

Difficulty: Insane
Points: 100
Category: Osint

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{osint_test_5_acb9}`',
    'Osint',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('99017625-adb4-40a2-b064-00a338d9ade7', 'NXCTF{osint_test_5_acb9}', '6054908de7bec0e3ed253a64dd8448da7da35d6d79a6291d37fbcda807838310');

-- Category: Crypto
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'c1da4ede-fba3-40f4-a3bf-514007d62037',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Crypto Challenge #1',
    'This is a comprehensive test challenge for the Crypto category.

Difficulty: Baby
Points: 20
Category: Crypto

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{crypto_test_1_9a21}`',
    'Crypto',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('c1da4ede-fba3-40f4-a3bf-514007d62037', 'NXCTF{crypto_test_1_9a21}', '305dbb085bc1cdc7675e49afe3f3cce2544e14dc8a2f9c03cd10bad1ab961952');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '26ad5089-0f5b-4a77-85c9-07702bd438a1',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Crypto Challenge #2',
    'This is a comprehensive test challenge for the Crypto category.

Difficulty: Easy
Points: 40
Category: Crypto

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{crypto_test_2_3af7}`',
    'Crypto',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Crypto Challenge #2","Cobalah telusuri lebih dalam di Crypto"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('26ad5089-0f5b-4a77-85c9-07702bd438a1', 'NXCTF{crypto_test_2_3af7}', '3c0549045b63fa391ed233b5ee8ffd7ca54f2db2dcf67e148399b84b1643f771');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '38f4fc62-8cdd-4734-a5a3-7b152977e8c5',
    NULL,
    'Crypto Challenge #3',
    'This is a comprehensive test challenge for the Crypto category.

Difficulty: Medium
Points: 60
Category: Crypto

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{crypto_test_3_a324}`',
    'Crypto',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('38f4fc62-8cdd-4734-a5a3-7b152977e8c5', 'NXCTF{crypto_test_3_a324}', '9eb5fec137ca94812a5fb37aafd36a1ebf97b933a7775892b8092e25b9e016e0');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '8a960384-07fc-4eb1-b39a-dbde582f2c71',
    NULL,
    'Crypto Challenge #4',
    'This is a comprehensive test challenge for the Crypto category.

Difficulty: Hard
Points: 80
Category: Crypto

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{crypto_test_4_715c}`',
    'Crypto',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Crypto Challenge #4","Cobalah telusuri lebih dalam di Crypto"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('8a960384-07fc-4eb1-b39a-dbde582f2c71', 'NXCTF{crypto_test_4_715c}', 'a332da7c3ec86cd8f0f1e78e95b6b335bac7716004fe442e7b58113215395266');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '7ab5676b-a973-41fd-8da1-7d25f0be763c',
    NULL,
    'Crypto Challenge #5',
    'This is a comprehensive test challenge for the Crypto category.

Difficulty: Insane
Points: 100
Category: Crypto

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{crypto_test_5_4cff}`',
    'Crypto',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('7ab5676b-a973-41fd-8da1-7d25f0be763c', 'NXCTF{crypto_test_5_4cff}', '334ff499db649622325aa80bbf6dfc003a28e643b5d1f0f1af13d98af6512de3');

-- Category: Reverse
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '24a407f0-4cce-44f2-a080-f2fae150cc4c',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Reverse Challenge #1',
    'This is a comprehensive test challenge for the Reverse category.

Difficulty: Baby
Points: 20
Category: Reverse

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{reverse_test_1_fbb2}`',
    'Reverse',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('24a407f0-4cce-44f2-a080-f2fae150cc4c', 'NXCTF{reverse_test_1_fbb2}', '1204b415b7a6259ca866a33645ff2a6577c581fe62853723b5286eecc459c237');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'a2500dea-ade1-478d-aa3d-12f2e0be950a',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Reverse Challenge #2',
    'This is a comprehensive test challenge for the Reverse category.

Difficulty: Easy
Points: 40
Category: Reverse

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{reverse_test_2_2a6b}`',
    'Reverse',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Reverse Challenge #2","Cobalah telusuri lebih dalam di Reverse"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('a2500dea-ade1-478d-aa3d-12f2e0be950a', 'NXCTF{reverse_test_2_2a6b}', '008ee1dea92fe0bcaeba57fa8bd7cf914633f0019050a21ace17fad1af9f29c5');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'ce71e41e-3a25-4857-80f4-baaad44c1e0c',
    NULL,
    'Reverse Challenge #3',
    'This is a comprehensive test challenge for the Reverse category.

Difficulty: Medium
Points: 60
Category: Reverse

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{reverse_test_3_5bf7}`',
    'Reverse',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('ce71e41e-3a25-4857-80f4-baaad44c1e0c', 'NXCTF{reverse_test_3_5bf7}', '41b2984a9b96dc183adb337252ce5940ef3d26f55ad625b73ca1a3da551dbe18');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '307eba19-039d-451d-a61e-a0228ed2cdb8',
    NULL,
    'Reverse Challenge #4',
    'This is a comprehensive test challenge for the Reverse category.

Difficulty: Hard
Points: 80
Category: Reverse

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{reverse_test_4_dfad}`',
    'Reverse',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Reverse Challenge #4","Cobalah telusuri lebih dalam di Reverse"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('307eba19-039d-451d-a61e-a0228ed2cdb8', 'NXCTF{reverse_test_4_dfad}', '85d6b82de362f00c62349560499c52d451dab257a4d9b035b64b53e31855d8d2');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '69e24446-f72f-43f8-bdcd-8d869f78f66f',
    NULL,
    'Reverse Challenge #5',
    'This is a comprehensive test challenge for the Reverse category.

Difficulty: Insane
Points: 100
Category: Reverse

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{reverse_test_5_f163}`',
    'Reverse',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('69e24446-f72f-43f8-bdcd-8d869f78f66f', 'NXCTF{reverse_test_5_f163}', 'b2c64b33c10a730ac728422db374f9ae94bd5964c1588fa571cda70f5ce42f67');

-- Category: Pwn
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '48891000-e7b2-4f58-a11c-e09377b37b79',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Pwn Challenge #1',
    'This is a comprehensive test challenge for the Pwn category.

Difficulty: Baby
Points: 20
Category: Pwn

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{pwn_test_1_96b9}`',
    'Pwn',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('48891000-e7b2-4f58-a11c-e09377b37b79', 'NXCTF{pwn_test_1_96b9}', 'aad242062f2d691707f0986d77c0767d6f131c66e36121fd6d8413b41be02926');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '361ba7dc-5f5d-492f-80a5-2e5f48e68766',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Pwn Challenge #2',
    'This is a comprehensive test challenge for the Pwn category.

Difficulty: Easy
Points: 40
Category: Pwn

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{pwn_test_2_b9bf}`',
    'Pwn',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Pwn Challenge #2","Cobalah telusuri lebih dalam di Pwn"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('361ba7dc-5f5d-492f-80a5-2e5f48e68766', 'NXCTF{pwn_test_2_b9bf}', 'd849b205d0205dfe1b4c3745432a581a027a5bb3f1381ed34bcecd208f5dede6');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '108b6745-0a07-40c9-b6fe-741e13da5061',
    NULL,
    'Pwn Challenge #3',
    'This is a comprehensive test challenge for the Pwn category.

Difficulty: Medium
Points: 60
Category: Pwn

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{pwn_test_3_b93c}`',
    'Pwn',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('108b6745-0a07-40c9-b6fe-741e13da5061', 'NXCTF{pwn_test_3_b93c}', 'd72bbb06e77425f643d99a9cdb972d74d0b77710bd0caee8228c21bfe3b36f0c');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '43667d5b-fa8f-45df-9a32-88e5eb21abc9',
    NULL,
    'Pwn Challenge #4',
    'This is a comprehensive test challenge for the Pwn category.

Difficulty: Hard
Points: 80
Category: Pwn

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{pwn_test_4_9dbd}`',
    'Pwn',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Pwn Challenge #4","Cobalah telusuri lebih dalam di Pwn"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('43667d5b-fa8f-45df-9a32-88e5eb21abc9', 'NXCTF{pwn_test_4_9dbd}', 'dfc9d9c5bdc42d4a3a70bea1ee5eb726f6b2871f0b887b5f61acfb491f7f4a2a');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'ca62c8c7-9097-40ba-8b87-a149d1fac227',
    NULL,
    'Pwn Challenge #5',
    'This is a comprehensive test challenge for the Pwn category.

Difficulty: Insane
Points: 100
Category: Pwn

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{pwn_test_5_ef63}`',
    'Pwn',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('ca62c8c7-9097-40ba-8b87-a149d1fac227', 'NXCTF{pwn_test_5_ef63}', 'd56b5da71cf87c7de0c65167158e554f18d9e69d0f758c72b4b95e86d9b2b806');

-- Category: Stegnography
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '085f7eac-e8b9-42d8-9210-0ea9a09c690e',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Stegnography Challenge #1',
    'This is a comprehensive test challenge for the Stegnography category.

Difficulty: Baby
Points: 20
Category: Stegnography

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{stegnography_test_1_b569}`',
    'Stegnography',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('085f7eac-e8b9-42d8-9210-0ea9a09c690e', 'NXCTF{stegnography_test_1_b569}', '55cd650da6421ed854138a68a4e3dc05dbc7fb709e47818d110ac8126ea2c077');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'a800778a-a37d-4905-854b-c792e947bdbb',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Stegnography Challenge #2',
    'This is a comprehensive test challenge for the Stegnography category.

Difficulty: Easy
Points: 40
Category: Stegnography

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{stegnography_test_2_12a5}`',
    'Stegnography',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Stegnography Challenge #2","Cobalah telusuri lebih dalam di Stegnography"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('a800778a-a37d-4905-854b-c792e947bdbb', 'NXCTF{stegnography_test_2_12a5}', '549040f910e190e277e772b6e480d31da4712b908e91fb3a1d7bfc483e165750');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '993fa858-d112-425b-b1ea-d46093b26809',
    NULL,
    'Stegnography Challenge #3',
    'This is a comprehensive test challenge for the Stegnography category.

Difficulty: Medium
Points: 60
Category: Stegnography

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{stegnography_test_3_2aa9}`',
    'Stegnography',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('993fa858-d112-425b-b1ea-d46093b26809', 'NXCTF{stegnography_test_3_2aa9}', 'ebad36419027257efb0dd0b8ce59f781ea63c0da0a59d1def55aa32b0c809974');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '909c2be8-cfb7-4d6f-a28b-6a8b210dd0ed',
    NULL,
    'Stegnography Challenge #4',
    'This is a comprehensive test challenge for the Stegnography category.

Difficulty: Hard
Points: 80
Category: Stegnography

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{stegnography_test_4_6a55}`',
    'Stegnography',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Stegnography Challenge #4","Cobalah telusuri lebih dalam di Stegnography"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('909c2be8-cfb7-4d6f-a28b-6a8b210dd0ed', 'NXCTF{stegnography_test_4_6a55}', '5b5b9958008efd3fca65f40565a4fedb9a850252202a75bb4ed2aa66e3e4c48d');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '80ce9018-4b71-4e5d-bcd8-a37737f1ec83',
    NULL,
    'Stegnography Challenge #5',
    'This is a comprehensive test challenge for the Stegnography category.

Difficulty: Insane
Points: 100
Category: Stegnography

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{stegnography_test_5_10a3}`',
    'Stegnography',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('80ce9018-4b71-4e5d-bcd8-a37737f1ec83', 'NXCTF{stegnography_test_5_10a3}', 'baff40d1ce110a2bca5c72c9e961021f2db1fb4fb5d0f96be52b7bfc628deb42');

-- Category: Misc
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '1fd2a792-c530-4957-ba8e-f973a19153d3',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Misc Challenge #1',
    'This is a comprehensive test challenge for the Misc category.

Difficulty: Baby
Points: 20
Category: Misc

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{misc_test_1_d853}`',
    'Misc',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('1fd2a792-c530-4957-ba8e-f973a19153d3', 'NXCTF{misc_test_1_d853}', 'aecf3f8e1c108de1098c6cf7a28c952d06021cf6cd0b9cc4ae018d33f41f78a1');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '4996b34b-7fb1-456c-8dfe-5fd0fb591153',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Misc Challenge #2',
    'This is a comprehensive test challenge for the Misc category.

Difficulty: Easy
Points: 40
Category: Misc

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{misc_test_2_cc43}`',
    'Misc',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Misc Challenge #2","Cobalah telusuri lebih dalam di Misc"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('4996b34b-7fb1-456c-8dfe-5fd0fb591153', 'NXCTF{misc_test_2_cc43}', '7ef1061a0475b01c1333328c65544719bd04d881dceb27e4a30f050448074d56');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '0b7fccca-06ea-47b9-b659-4c0e077c71fe',
    NULL,
    'Misc Challenge #3',
    'This is a comprehensive test challenge for the Misc category.

Difficulty: Medium
Points: 60
Category: Misc

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{misc_test_3_ac87}`',
    'Misc',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('0b7fccca-06ea-47b9-b659-4c0e077c71fe', 'NXCTF{misc_test_3_ac87}', 'f5cbcef4cedf7739cd463631006d6d9d1177b9e710b434d2d28707872e0878c1');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '21550c12-34ba-4dbe-a4e9-fe25b4d3eee8',
    NULL,
    'Misc Challenge #4',
    'This is a comprehensive test challenge for the Misc category.

Difficulty: Hard
Points: 80
Category: Misc

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{misc_test_4_c2e3}`',
    'Misc',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Misc Challenge #4","Cobalah telusuri lebih dalam di Misc"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('21550c12-34ba-4dbe-a4e9-fe25b4d3eee8', 'NXCTF{misc_test_4_c2e3}', '02e3a31ebcc2a479702c56b47eaa2f956f99cbfc3830d4fb58242479a482c78f');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '5d2d8948-598a-4c00-8fcd-7a0bf6a8c917',
    NULL,
    'Misc Challenge #5',
    'This is a comprehensive test challenge for the Misc category.

Difficulty: Insane
Points: 100
Category: Misc

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{misc_test_5_85c5}`',
    'Misc',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('5d2d8948-598a-4c00-8fcd-7a0bf6a8c917', 'NXCTF{misc_test_5_85c5}', 'e9af66ea6d6f619759d368be6912b6caf5c63b89e32a870027ffd573aa4ed810');

-- Category: Blockchain
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'def86c82-846c-40c6-9fad-ed5aaaf5c2bc',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Blockchain Challenge #1',
    'This is a comprehensive test challenge for the Blockchain category.

Difficulty: Baby
Points: 20
Category: Blockchain

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{blockchain_test_1_abdd}`',
    'Blockchain',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('def86c82-846c-40c6-9fad-ed5aaaf5c2bc', 'NXCTF{blockchain_test_1_abdd}', 'b3ea9569391e46ac462f3899965fbe2d601bb111601ba37d5285ec9dd5104797');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '70c6d254-a7b4-46d1-b634-924ca7d25d83',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Blockchain Challenge #2',
    'This is a comprehensive test challenge for the Blockchain category.

Difficulty: Easy
Points: 40
Category: Blockchain

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{blockchain_test_2_6075}`',
    'Blockchain',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Blockchain Challenge #2","Cobalah telusuri lebih dalam di Blockchain"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('70c6d254-a7b4-46d1-b634-924ca7d25d83', 'NXCTF{blockchain_test_2_6075}', 'e43d2d696ce797ddc12554f593ac19d958d045f9fe8fa544c7ad61d4ad550600');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '1eb5ab27-0fe7-4ceb-aab1-6373f08387d0',
    NULL,
    'Blockchain Challenge #3',
    'This is a comprehensive test challenge for the Blockchain category.

Difficulty: Medium
Points: 60
Category: Blockchain

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{blockchain_test_3_0a7a}`',
    'Blockchain',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('1eb5ab27-0fe7-4ceb-aab1-6373f08387d0', 'NXCTF{blockchain_test_3_0a7a}', 'c844239d8b19c6992bf7cf63fef75e3328e8bc24d2573e34395796b41b0e2d23');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '883cee76-9c5e-48f3-a9f4-81768805a847',
    NULL,
    'Blockchain Challenge #4',
    'This is a comprehensive test challenge for the Blockchain category.

Difficulty: Hard
Points: 80
Category: Blockchain

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{blockchain_test_4_1d3b}`',
    'Blockchain',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Blockchain Challenge #4","Cobalah telusuri lebih dalam di Blockchain"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('883cee76-9c5e-48f3-a9f4-81768805a847', 'NXCTF{blockchain_test_4_1d3b}', '714207c21d295d2030b67d5db0290380faf3a3f4fc6fcfd03e9bd66a245a025e');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'c2a02732-7d3a-40dc-97ef-8332f9725d00',
    NULL,
    'Blockchain Challenge #5',
    'This is a comprehensive test challenge for the Blockchain category.

Difficulty: Insane
Points: 100
Category: Blockchain

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{blockchain_test_5_9c99}`',
    'Blockchain',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('c2a02732-7d3a-40dc-97ef-8332f9725d00', 'NXCTF{blockchain_test_5_9c99}', 'b2fc33aa24b247f9303088ec5537dba5314fd14f3f303a3dc340772ff6faa83e');

-- Category: Network
INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '8bb42130-4242-420b-a4ad-e8cb2b63e180',
    '9165b1c7-c72b-491d-81f6-887257c14ebe',
    'Network Challenge #1',
    'This is a comprehensive test challenge for the Network category.

Difficulty: Baby
Points: 20
Category: Network

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{network_test_1_9f89}`',
    'Network',
    20,
    'Baby',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('8bb42130-4242-420b-a4ad-e8cb2b63e180', 'NXCTF{network_test_1_9f89}', '3cb92b9a39c40fad85cc7d4778ef2e34246cc688c583c1da724b8a6b8424bf5e');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'ebc2e0b1-b09c-4d6b-bb9d-847d3e0ce5e2',
    'e4bd9aa6-9cbd-44c5-91e5-3a1281aa4d85',
    'Network Challenge #2',
    'This is a comprehensive test challenge for the Network category.

Difficulty: Easy
Points: 40
Category: Network

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{network_test_2_2b07}`',
    'Network',
    40,
    'Easy',
    true,
    '["Ini adalah hint untuk soal Network Challenge #2","Cobalah telusuri lebih dalam di Network"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('ebc2e0b1-b09c-4d6b-bb9d-847d3e0ce5e2', 'NXCTF{network_test_2_2b07}', '50edef5899cba32988c0c280bbcd06a6034e324a3a81ccd382ec7ab58be44f34');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    'f1d5788b-25f4-4f4b-9fb0-4ba36955508c',
    NULL,
    'Network Challenge #3',
    'This is a comprehensive test challenge for the Network category.

Difficulty: Medium
Points: 60
Category: Network

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{network_test_3_a319}`',
    'Network',
    60,
    'Medium',
    true,
    NULL,
    ARRAY['web', 'nc s1.ariaf.my.id 6003'],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('f1d5788b-25f4-4f4b-9fb0-4ba36955508c', 'NXCTF{network_test_3_a319}', '572ee01da08f50606ddddf7f74d34a67575029b58e1027f696bc0fb015cf0503');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '19a44662-fb50-473b-ad43-087ee13be94a',
    NULL,
    'Network Challenge #4',
    'This is a comprehensive test challenge for the Network category.

Difficulty: Hard
Points: 80
Category: Network

> Author: [system](./user/system)

*Check the hints section for clues!*


Flag for testing: `NXCTF{network_test_4_eedf}`',
    'Network',
    80,
    'Hard',
    true,
    '["Ini adalah hint untuk soal Network Challenge #4","Cobalah telusuri lebih dalam di Network"]'::jsonb,
    ARRAY[]::TEXT[],
    false,
    '[{"url":"https://example.com/file.zip","name":"challenge_files.zip","type":"file"},{"url":"http://s1.ariaf.my.id:8000","name":"Web Service","type":"link"}]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('19a44662-fb50-473b-ad43-087ee13be94a', 'NXCTF{network_test_4_eedf}', 'e409e44a1eae18e1a2f1c259b4469512ea004e4dd3d145fb873629356a8f26f1');

INSERT INTO public.challenges (
            id, event_id, title, description, category, points, difficulty,
            is_active, hint, services, flag_placeholder, attachments
        )
VALUES (
    '668f2c6b-1149-4449-9d40-a430350944fc',
    NULL,
    'Network Challenge #5',
    'This is a comprehensive test challenge for the Network category.

Difficulty: Insane
Points: 100
Category: Network

> Author: [system](./user/system)

*No hints available for this one.*
*This challenge uses a flag placeholder.*

Flag for testing: `NXCTF{network_test_5_4c12}`',
    'Network',
    100,
    'Insane',
    true,
    NULL,
    ARRAY[]::TEXT[],
    true,
    '[]'::jsonb
);
INSERT INTO public.challenge_flags (challenge_id, flag, flag_hash)
VALUES ('668f2c6b-1149-4449-9d40-a430350944fc', 'NXCTF{network_test_5_4c12}', '6ccbe14cd0d11928d695bf926b3dda0f4196adcd4fe91cb413ca1688e0bdd02a');
