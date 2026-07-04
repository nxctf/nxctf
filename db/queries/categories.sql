-- ==============================================
-- Queries: categories
-- ==============================================

DROP POLICY IF EXISTS "Categories select public" ON public.categories;
CREATE POLICY "Categories select public" ON public.categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Categories admin all" ON public.categories;
CREATE POLICY "Categories admin all" ON public.categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Subcategories select public" ON public.sub_categories;
CREATE POLICY "Subcategories select public" ON public.sub_categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Subcategories admin all" ON public.sub_categories;
CREATE POLICY "Subcategories admin all" ON public.sub_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ==============================================
-- Functions: categories & sub_categories CRUD
-- ==============================================

-- categories functions
CREATE OR REPLACE FUNCTION add_category(
  p_name VARCHAR(64),
  p_description TEXT DEFAULT '',
  p_icon VARCHAR(64) DEFAULT 'HelpCircle',
  p_color VARCHAR(32) DEFAULT 'blue',
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can add categories';
  END IF;

  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO p_sort_order FROM public.categories;
  END IF;

  INSERT INTO public.categories (name, description, icon, color, sort_order)
  VALUES (p_name, p_description, p_icon, p_color, p_sort_order);

  PERFORM public.write_admin_audit_log(
    'CREATE',
    'category',
    NULL,
    NULL,
    jsonb_build_object('name', p_name, 'description', p_description, 'icon', p_icon, 'color', p_color, 'sort_order', p_sort_order),
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION add_category(VARCHAR(64), TEXT, VARCHAR(64), VARCHAR(32), INTEGER) TO authenticated;


CREATE OR REPLACE FUNCTION update_category(
  p_name VARCHAR(64),
  p_description TEXT,
  p_icon VARCHAR(64),
  p_color VARCHAR(32),
  p_sort_order INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_before JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can update categories';
  END IF;

  SELECT jsonb_build_object(
    'name', name,
    'description', description,
    'icon', icon,
    'color', color,
    'sort_order', sort_order
  ) INTO v_before
  FROM public.categories
  WHERE name = p_name;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  UPDATE public.categories
  SET
    description = p_description,
    icon = p_icon,
    color = p_color,
    sort_order = p_sort_order
  WHERE name = p_name;

  PERFORM public.write_admin_audit_log(
    'UPDATE',
    'category',
    NULL,
    v_before,
    jsonb_build_object('name', p_name, 'description', p_description, 'icon', p_icon, 'color', p_color, 'sort_order', p_sort_order),
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION update_category(VARCHAR(64), TEXT, VARCHAR(64), VARCHAR(32), INTEGER) TO authenticated;


CREATE OR REPLACE FUNCTION delete_category(
  p_name VARCHAR(64)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_before JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can delete categories';
  END IF;

  SELECT jsonb_build_object(
    'name', name,
    'description', description,
    'icon', icon,
    'color', color,
    'sort_order', sort_order
  ) INTO v_before
  FROM public.categories
  WHERE name = p_name;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  DELETE FROM public.categories WHERE name = p_name;

  PERFORM public.write_admin_audit_log(
    'DELETE',
    'category',
    NULL,
    v_before,
    NULL,
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION delete_category(VARCHAR(64)) TO authenticated;


-- sub_categories functions
CREATE OR REPLACE FUNCTION add_subcategory(
  p_name VARCHAR(64),
  p_description TEXT DEFAULT '',
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can add subcategories';
  END IF;

  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO p_sort_order FROM public.sub_categories;
  END IF;

  INSERT INTO public.sub_categories (name, description, sort_order)
  VALUES (p_name, p_description, p_sort_order);

  PERFORM public.write_admin_audit_log(
    'CREATE',
    'subcategory',
    NULL,
    NULL,
    jsonb_build_object('name', p_name, 'description', p_description, 'sort_order', p_sort_order),
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION add_subcategory(VARCHAR(64), TEXT, INTEGER) TO authenticated;


CREATE OR REPLACE FUNCTION update_subcategory(
  p_name VARCHAR(64),
  p_description TEXT,
  p_sort_order INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_before JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can update subcategories';
  END IF;

  SELECT jsonb_build_object(
    'name', name,
    'description', description,
    'sort_order', sort_order
  ) INTO v_before
  FROM public.sub_categories
  WHERE name = p_name;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Subcategory not found';
  END IF;

  UPDATE public.sub_categories
  SET
    description = p_description,
    sort_order = p_sort_order
  WHERE name = p_name;

  PERFORM public.write_admin_audit_log(
    'UPDATE',
    'subcategory',
    NULL,
    v_before,
    jsonb_build_object('name', p_name, 'description', p_description, 'sort_order', p_sort_order),
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION update_subcategory(VARCHAR(64), TEXT, INTEGER) TO authenticated;


CREATE OR REPLACE FUNCTION delete_subcategory(
  p_name VARCHAR(64)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_before JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can delete subcategories';
  END IF;

  SELECT jsonb_build_object(
    'name', name,
    'description', description,
    'sort_order', sort_order
  ) INTO v_before
  FROM public.sub_categories
  WHERE name = p_name;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Subcategory not found';
  END IF;

  DELETE FROM public.sub_categories WHERE name = p_name;

  PERFORM public.write_admin_audit_log(
    'DELETE',
    'subcategory',
    NULL,
    v_before,
    NULL,
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION delete_subcategory(VARCHAR(64)) TO authenticated;


-- batch reordering functions
CREATE OR REPLACE FUNCTION reorder_categories(
  p_ordered_names VARCHAR(64)[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_name VARCHAR(64);
  v_idx INTEGER := 1;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can reorder categories';
  END IF;

  FOREACH v_name IN ARRAY p_ordered_names LOOP
    UPDATE public.categories
    SET sort_order = v_idx
    WHERE name = v_name;
    v_idx := v_idx + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION reorder_categories(VARCHAR(64)[]) TO authenticated;


CREATE OR REPLACE FUNCTION reorder_subcategories(
  p_ordered_names VARCHAR(64)[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_name VARCHAR(64);
  v_idx INTEGER := 1;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can reorder subcategories';
  END IF;

  FOREACH v_name IN ARRAY p_ordered_names LOOP
    UPDATE public.sub_categories
    SET sort_order = v_idx
    WHERE name = v_name;
    v_idx := v_idx + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION reorder_subcategories(VARCHAR(64)[]) TO authenticated;
