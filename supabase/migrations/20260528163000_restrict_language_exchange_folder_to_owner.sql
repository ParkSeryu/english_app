-- Restrict the language exchange content folder to the app owner only.

DO $$
DECLARE
  v_folder_id uuid;
  v_group_id uuid;
  v_owner_id uuid := '261f2e21-9532-446f-8694-0b2bc54df360';
BEGIN
  SELECT id INTO v_folder_id
  FROM public.content_folders
  WHERE slug = 'language-exchange'
  LIMIT 1;

  IF v_folder_id IS NULL THEN
    RAISE EXCEPTION 'language-exchange content folder does not exist';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner_id) THEN
    RAISE EXCEPTION 'language-exchange owner user % does not exist', v_owner_id;
  END IF;

  INSERT INTO public.content_groups (slug, name)
  VALUES ('language-exchange-private-owner', '언어교환 개인 접근')
  ON CONFLICT (slug) DO UPDATE
    SET name = excluded.name
  RETURNING id INTO v_group_id;

  INSERT INTO public.content_group_memberships (group_id, user_id)
  VALUES (v_group_id, v_owner_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  DELETE FROM public.content_folder_permissions p
  USING public.content_groups g
  WHERE p.group_id = g.id
    AND p.folder_id = v_folder_id
    AND p.permission = 'read'
    AND g.slug = 'all_authenticated';

  INSERT INTO public.content_folder_permissions (folder_id, group_id, permission)
  VALUES (v_folder_id, v_group_id, 'read')
  ON CONFLICT (folder_id, group_id, permission) DO NOTHING;
END $$;

NOTIFY pgrst, 'reload schema';
