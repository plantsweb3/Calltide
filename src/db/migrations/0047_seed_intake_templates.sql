-- Seed intake templates for 10 trades × 2 scope levels
-- Migration: 0047_seed_intake_templates

-- ═══ PAINT — RESIDENTIAL (6 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('paint', 'residential', 1, 'interior_exterior', 'Is this an interior job, exterior, or both?', '¿Es un trabajo de interior, exterior, o ambos?', 'select', '["interior","exterior","both"]', 1),
('paint', 'residential', 2, 'surface_type', 'What needs painting — just walls, walls and trim, cabinets, or a full repaint?', '¿Qué necesita pintar — solo paredes, paredes y molduras, gabinetes, o todo?', 'select', '["walls_only","walls_and_trim","cabinets","full_repaint"]', 1),
('paint', 'residential', 3, 'room_count', 'About how many rooms are we talking about?', '¿Más o menos cuántas habitaciones?', 'number', NULL, 1),
('paint', 'residential', 4, 'condition', 'What condition are the surfaces in — good shape, need some prep, or damaged?', '¿En qué condición están las superficies — buen estado, necesitan preparación, o dañadas?', 'select', '["good","needs_prep","damaged"]', 1),
('paint', 'residential', 5, 'timeline', 'When are you looking to have this done?', '¿Para cuándo necesita que esté listo?', 'text', NULL, 1),
('paint', 'residential', 6, 'address', 'What''s the property address?', '¿Cuál es la dirección de la propiedad?', 'text', NULL, 0);
--> statement-breakpoint

-- ═══ PAINT — COMMERCIAL (12 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('paint', 'commercial', 1, 'project_type', 'What type of building or project is this?', '¿Qué tipo de edificio o proyecto es?', 'select', '["apartment_complex","office_building","retail","university","hotel","warehouse","other"]', 1),
('paint', 'commercial', 2, 'interior_exterior', 'Interior, exterior, or both?', '¿Interior, exterior, o ambos?', 'select', '["interior","exterior","both"]', 1),
('paint', 'commercial', 3, 'num_units', 'How many units or rooms are in the building?', '¿Cuántas unidades o habitaciones tiene el edificio?', 'number', NULL, 0),
('paint', 'commercial', 4, 'sqft_estimate', 'Do you have an approximate square footage?', '¿Tiene un aproximado de los pies cuadrados?', 'number', NULL, 0),
('paint', 'commercial', 5, 'num_stories', 'How many stories is the building?', '¿Cuántos pisos tiene el edificio?', 'number', NULL, 1),
('paint', 'commercial', 6, 'occupied', 'Will the building be occupied during the work, or vacant?', '¿El edificio estará ocupado durante el trabajo, o desocupado?', 'boolean', NULL, 1),
('paint', 'commercial', 7, 'new_or_repaint', 'Is this new construction, a repaint, or damage repair?', '¿Es construcción nueva, repintura, o reparación de daños?', 'select', '["new_construction","repaint","damage_repair"]', 1),
('paint', 'commercial', 8, 'common_areas', 'Are there common areas like hallways, lobbies, or stairwells?', '¿Hay áreas comunes como pasillos, vestíbulos, o escaleras?', 'boolean', NULL, 0),
('paint', 'commercial', 9, 'surface_condition', 'What condition are the surfaces in?', '¿En qué condición están las superficies?', 'select', '["good","needs_prep","heavy_prep"]', 1),
('paint', 'commercial', 10, 'has_plans', 'Do you have plans or specs available?', '¿Tiene planos o especificaciones disponibles?', 'boolean', NULL, 0),
('paint', 'commercial', 11, 'timeline', 'What''s the target completion date?', '¿Cuál es la fecha objetivo de terminación?', 'text', NULL, 1),
('paint', 'commercial', 12, 'gc_or_owner', 'Are you the property owner or the general contractor?', '¿Es usted el dueño de la propiedad o el contratista general?', 'text', NULL, 0);
--> statement-breakpoint

-- ═══ HVAC — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('hvac', 'residential', 1, 'service_type', 'Are you looking for a repair, maintenance, a new installation, or a replacement?', '¿Busca una reparación, mantenimiento, instalación nueva, o un reemplazo?', 'select', '["repair","maintenance","new_install","replacement"]', 1),
('hvac', 'residential', 2, 'system_type', 'What type of system is it — central AC, heat pump, furnace, mini split, or full system?', '¿Qué tipo de sistema es — AC central, bomba de calor, calefacción, mini split, o sistema completo?', 'select', '["central_ac","heat_pump","furnace","mini_split","full_system"]', 1),
('hvac', 'residential', 3, 'home_sqft', 'About how many square feet is the home?', '¿Más o menos cuántos pies cuadrados tiene la casa?', 'number', NULL, 0),
('hvac', 'residential', 4, 'urgency_detail', 'Is this an emergency — like no AC right now — or more of a planned project?', '¿Es una emergencia — como sin AC ahorita — o más un proyecto planeado?', 'select', '["emergency_no_ac","soon","flexible"]', 1),
('hvac', 'residential', 5, 'timeline', 'When would you like us to come out?', '¿Cuándo le gustaría que fuéramos?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ HVAC — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('hvac', 'commercial', 1, 'project_type', 'What type of building is this for?', '¿Para qué tipo de edificio es?', 'select', '["office","retail","restaurant","warehouse","university","hospital","multi_unit","other"]', 1),
('hvac', 'commercial', 2, 'service_type', 'Is this a new installation, replacement, repair, maintenance, or retrofit?', '¿Es instalación nueva, reemplazo, reparación, mantenimiento, o retrofit?', 'select', '["new_install","replacement","repair","maintenance","retrofit"]', 1),
('hvac', 'commercial', 3, 'sqft_estimate', 'What''s the approximate square footage?', '¿Cuál es el aproximado de pies cuadrados?', 'number', NULL, 0),
('hvac', 'commercial', 4, 'num_floors', 'How many floors?', '¿Cuántos pisos?', 'number', NULL, 1),
('hvac', 'commercial', 5, 'num_zones', 'How many HVAC zones or units are we talking about?', '¿Cuántas zonas o unidades de HVAC estamos hablando?', 'number', NULL, 0),
('hvac', 'commercial', 6, 'equipment_provided', 'Is the equipment being provided, or is this supply and install?', '¿El equipo ya está proporcionado, o es suministro e instalación?', 'boolean', NULL, 0),
('hvac', 'commercial', 7, 'existing_system', 'What''s the current system — brand and approximate age if you know?', '¿Cuál es el sistema actual — marca y edad aproximada si sabe?', 'text', NULL, 0),
('hvac', 'commercial', 8, 'union_job', 'Is this a union job or open shop?', '¿Es trabajo sindicalizado o abierto?', 'boolean', NULL, 0),
('hvac', 'commercial', 9, 'has_plans', 'Do you have mechanical plans or specs?', '¿Tiene planos mecánicos o especificaciones?', 'boolean', NULL, 0),
('hvac', 'commercial', 10, 'timeline', 'What''s the target completion date?', '¿Cuál es la fecha objetivo de terminación?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ PLUMBING — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('plumbing', 'residential', 1, 'service_type', 'What''s the issue — a leak, a clog, water heater problem, or something else?', '¿Cuál es el problema — una fuga, un tapón, problema con el calentador de agua, u otra cosa?', 'select', '["leak","clog","water_heater","sewer","fixture_install","repiping","other"]', 1),
('plumbing', 'residential', 2, 'location', 'Where in the home is the problem — kitchen, bathroom, basement, or outside?', '¿En qué parte de la casa está el problema — cocina, baño, sótano, o afuera?', 'select', '["kitchen","bathroom","basement","laundry","outside","multiple"]', 1),
('plumbing', 'residential', 3, 'severity', 'Is water actively leaking or flooding right now?', '¿Hay agua saliendo o inundando en este momento?', 'boolean', NULL, 1),
('plumbing', 'residential', 4, 'home_age', 'About how old is the home?', '¿Aproximadamente qué edad tiene la casa?', 'text', NULL, 0),
('plumbing', 'residential', 5, 'timeline', 'When do you need someone out there?', '¿Para cuándo necesita que vayamos?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ PLUMBING — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('plumbing', 'commercial', 1, 'project_type', 'What type of building is this?', '¿Qué tipo de edificio es?', 'select', '["restaurant","office","retail","apartment","hotel","hospital","warehouse","other"]', 1),
('plumbing', 'commercial', 2, 'service_type', 'Is this a repair, new installation, or a renovation/remodel?', '¿Es una reparación, instalación nueva, o renovación/remodelación?', 'select', '["repair","new_install","renovation","maintenance","backflow_test"]', 1),
('plumbing', 'commercial', 3, 'num_fixtures', 'About how many fixtures or units are involved?', '¿Aproximadamente cuántos accesorios o unidades están involucrados?', 'number', NULL, 0),
('plumbing', 'commercial', 4, 'num_floors', 'How many floors in the building?', '¿Cuántos pisos tiene el edificio?', 'number', NULL, 1),
('plumbing', 'commercial', 5, 'active_leak', 'Is there an active leak or emergency situation right now?', '¿Hay una fuga activa o situación de emergencia en este momento?', 'boolean', NULL, 1),
('plumbing', 'commercial', 6, 'occupied', 'Is the building occupied during work hours?', '¿El edificio está ocupado durante horas de trabajo?', 'boolean', NULL, 1),
('plumbing', 'commercial', 7, 'has_plans', 'Do you have plumbing plans or specs?', '¿Tiene planos de plomería o especificaciones?', 'boolean', NULL, 0),
('plumbing', 'commercial', 8, 'backflow_certified', 'Do you need backflow prevention testing or certification?', '¿Necesita prueba o certificación de prevención de reflujo?', 'boolean', NULL, 0),
('plumbing', 'commercial', 9, 'gc_or_owner', 'Are you the property owner, manager, or general contractor?', '¿Es usted el dueño, gerente, o contratista general?', 'text', NULL, 0),
('plumbing', 'commercial', 10, 'timeline', 'What''s the target completion date?', '¿Cuál es la fecha objetivo de terminación?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ ELECTRICAL — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('electrical', 'residential', 1, 'service_type', 'What do you need done — a repair, new installation, panel upgrade, or something else?', '¿Qué necesita — reparación, instalación nueva, mejora de panel, u otra cosa?', 'select', '["repair","outlet_switch","panel_upgrade","lighting","ceiling_fan","generator","ev_charger","rewiring","other"]', 1),
('electrical', 'residential', 2, 'issue_description', 'Can you describe what''s happening or what you need?', '¿Puede describir lo que está pasando o lo que necesita?', 'text', NULL, 1),
('electrical', 'residential', 3, 'safety_concern', 'Are there any sparks, burning smells, or flickering lights?', '¿Hay chispas, olor a quemado, o luces parpadeando?', 'boolean', NULL, 1),
('electrical', 'residential', 4, 'home_age', 'About how old is the home?', '¿Aproximadamente qué edad tiene la casa?', 'text', NULL, 0),
('electrical', 'residential', 5, 'timeline', 'When do you need this taken care of?', '¿Para cuándo necesita que se resuelva?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ ELECTRICAL — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('electrical', 'commercial', 1, 'project_type', 'What type of building or project is this?', '¿Qué tipo de edificio o proyecto es?', 'select', '["office","retail","restaurant","warehouse","industrial","multi_unit","new_construction","other"]', 1),
('electrical', 'commercial', 2, 'service_type', 'Is this new wiring, a panel upgrade, lighting, or a repair?', '¿Es cableado nuevo, mejora de panel, iluminación, o reparación?', 'select', '["new_wiring","panel_upgrade","lighting","repair","data_low_voltage","generator","ev_charging","other"]', 1),
('electrical', 'commercial', 3, 'sqft_estimate', 'What''s the approximate square footage?', '¿Cuál es el aproximado de pies cuadrados?', 'number', NULL, 0),
('electrical', 'commercial', 4, 'num_floors', 'How many floors?', '¿Cuántos pisos?', 'number', NULL, 1),
('electrical', 'commercial', 5, 'voltage_requirements', 'Do you need standard voltage or three-phase power?', '¿Necesita voltaje estándar o energía trifásica?', 'select', '["standard","three_phase","both","unsure"]', 0),
('electrical', 'commercial', 6, 'permit_required', 'Has a permit been pulled, or will you need us to handle that?', '¿Ya se sacó el permiso, o necesita que nosotros lo manejemos?', 'select', '["already_pulled","need_help","unsure"]', 0),
('electrical', 'commercial', 7, 'occupied', 'Is the building occupied, or is this during construction?', '¿El edificio está ocupado, o es durante construcción?', 'boolean', NULL, 1),
('electrical', 'commercial', 8, 'has_plans', 'Do you have electrical plans or specs?', '¿Tiene planos eléctricos o especificaciones?', 'boolean', NULL, 0),
('electrical', 'commercial', 9, 'union_job', 'Is this a union job?', '¿Es trabajo sindicalizado?', 'boolean', NULL, 0),
('electrical', 'commercial', 10, 'timeline', 'What''s the target completion date?', '¿Cuál es la fecha objetivo de terminación?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ ROOFING — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('roofing', 'residential', 1, 'service_type', 'Are you looking for a repair, a full replacement, or an inspection?', '¿Busca una reparación, reemplazo completo, o una inspección?', 'select', '["repair","replacement","inspection","storm_damage","leak","gutter"]', 1),
('roofing', 'residential', 2, 'roof_type', 'What type of roof do you have — shingles, tile, metal, or flat?', '¿Qué tipo de techo tiene — tejas, teja de barro, metal, o plano?', 'select', '["shingles","tile","metal","flat","unsure"]', 1),
('roofing', 'residential', 3, 'storm_damage', 'Is this related to storm or hail damage?', '¿Está relacionado con daño por tormenta o granizo?', 'boolean', NULL, 1),
('roofing', 'residential', 4, 'insurance_claim', 'Are you filing an insurance claim, or is this out of pocket?', '¿Está presentando un reclamo de seguro, o es de su bolsillo?', 'select', '["insurance","out_of_pocket","unsure"]', 0),
('roofing', 'residential', 5, 'timeline', 'How soon do you need this handled?', '¿Qué tan pronto necesita que se atienda?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ ROOFING — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('roofing', 'commercial', 1, 'project_type', 'What type of building?', '¿Qué tipo de edificio?', 'select', '["office","retail","warehouse","apartment","industrial","church","school","other"]', 1),
('roofing', 'commercial', 2, 'service_type', 'Is this a repair, re-roof, new construction, or coating?', '¿Es reparación, re-techado, construcción nueva, o recubrimiento?', 'select', '["repair","reroof","new_construction","coating","inspection"]', 1),
('roofing', 'commercial', 3, 'roof_system', 'What type of roof system — TPO, EPDM, built-up, metal, or modified bitumen?', '¿Qué tipo de sistema de techo — TPO, EPDM, multicapa, metal, o bitumen modificado?', 'select', '["tpo","epdm","built_up","metal","modified_bitumen","unsure"]', 0),
('roofing', 'commercial', 4, 'sqft_estimate', 'What''s the approximate roof area in square feet?', '¿Cuál es el área aproximada del techo en pies cuadrados?', 'number', NULL, 0),
('roofing', 'commercial', 5, 'num_stories', 'How many stories?', '¿Cuántos pisos?', 'number', NULL, 1),
('roofing', 'commercial', 6, 'storm_damage', 'Is this storm or hail damage related?', '¿Está relacionado con daño por tormenta o granizo?', 'boolean', NULL, 1),
('roofing', 'commercial', 7, 'insurance_claim', 'Will this be an insurance claim?', '¿Será un reclamo de seguro?', 'select', '["yes","no","unsure"]', 0),
('roofing', 'commercial', 8, 'occupied', 'Is the building occupied?', '¿El edificio está ocupado?', 'boolean', NULL, 1),
('roofing', 'commercial', 9, 'has_plans', 'Do you have specs or a scope of work?', '¿Tiene especificaciones o alcance de trabajo?', 'boolean', NULL, 0),
('roofing', 'commercial', 10, 'timeline', 'What''s the target completion date?', '¿Cuál es la fecha objetivo de terminación?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ CONCRETE — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('concrete', 'residential', 1, 'project_type', 'What do you need — a driveway, patio, sidewalk, foundation repair, or something else?', '¿Qué necesita — entrada de auto, patio, banqueta, reparación de cimentación, u otra cosa?', 'select', '["driveway","patio","sidewalk","foundation_repair","retaining_wall","pool_deck","steps","other"]', 1),
('concrete', 'residential', 2, 'new_or_repair', 'Is this new concrete, or a repair on existing?', '¿Es concreto nuevo, o reparación de lo existente?', 'select', '["new","repair","replace"]', 1),
('concrete', 'residential', 3, 'approx_size', 'About how big is the area — in feet or yards?', '¿Aproximadamente qué tan grande es el área — en pies o yardas?', 'text', NULL, 1),
('concrete', 'residential', 4, 'finish_type', 'Do you want a plain finish, stamped, or stained?', '¿Quiere acabado liso, estampado, o teñido?', 'select', '["plain","stamped","stained","exposed_aggregate","broom_finish"]', 0),
('concrete', 'residential', 5, 'timeline', 'When are you looking to get this done?', '¿Para cuándo quiere que se haga?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ CONCRETE — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('concrete', 'commercial', 1, 'project_type', 'What type of project — parking lot, foundation, warehouse floor, sidewalk, or other?', '¿Qué tipo de proyecto — estacionamiento, cimentación, piso de bodega, banqueta, u otro?', 'select', '["parking_lot","foundation","warehouse_floor","sidewalk","loading_dock","retaining_wall","other"]', 1),
('concrete', 'commercial', 2, 'new_or_repair', 'Is this new construction or repair work?', '¿Es construcción nueva o trabajo de reparación?', 'select', '["new","repair","replace","overlay"]', 1),
('concrete', 'commercial', 3, 'sqft_or_yards', 'What''s the approximate area — in square feet or cubic yards?', '¿Cuál es el área aproximada — en pies cuadrados o yardas cúbicas?', 'text', NULL, 1),
('concrete', 'commercial', 4, 'thickness', 'What thickness is needed — 4 inch, 6 inch, or heavier?', '¿Qué grosor se necesita — 4 pulgadas, 6 pulgadas, o más?', 'select', '["4_inch","6_inch","8_inch_plus","unsure"]', 0),
('concrete', 'commercial', 5, 'reinforcement', 'Will you need rebar, fiber mesh, or post-tension?', '¿Necesitará varilla, malla de fibra, o post-tensado?', 'select', '["rebar","fiber_mesh","post_tension","unsure"]', 0),
('concrete', 'commercial', 6, 'grade_work', 'Is grading or excavation needed?', '¿Se necesita nivelación o excavación?', 'boolean', NULL, 0),
('concrete', 'commercial', 7, 'occupied', 'Will the site be active with other trades during the pour?', '¿El sitio estará activo con otros oficios durante el colado?', 'boolean', NULL, 0),
('concrete', 'commercial', 8, 'has_plans', 'Do you have structural plans or specs?', '¿Tiene planos estructurales o especificaciones?', 'boolean', NULL, 0),
('concrete', 'commercial', 9, 'gc_or_owner', 'Are you the general contractor or the property owner?', '¿Es usted el contratista general o el dueño de la propiedad?', 'text', NULL, 0),
('concrete', 'commercial', 10, 'timeline', 'What''s the target pour date?', '¿Cuál es la fecha objetivo de colado?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ DRYWALL — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('drywall', 'residential', 1, 'service_type', 'Do you need drywall hung, repaired, or finished and textured?', '¿Necesita que cuelguen tablaroca, repararla, o acabarla y texturizarla?', 'select', '["hang","repair","finish_texture","patch","full_room"]', 1),
('drywall', 'residential', 2, 'scope', 'Is this a whole room, a section of wall, or just a patch?', '¿Es una habitación completa, una sección de pared, o solo un parche?', 'select', '["whole_room","section","patch","ceiling","multiple_rooms"]', 1),
('drywall', 'residential', 3, 'texture_type', 'What texture do you want — smooth, knockdown, orange peel, or skip trowel?', '¿Qué textura quiere — lisa, knockdown, piel de naranja, o llana?', 'select', '["smooth","knockdown","orange_peel","skip_trowel","match_existing"]', 0),
('drywall', 'residential', 4, 'cause', 'What caused the damage — water, impact, settling, or remodel?', '¿Qué causó el daño — agua, impacto, asentamiento, o remodelación?', 'select', '["water_damage","impact","settling","remodel","new_construction"]', 0),
('drywall', 'residential', 5, 'timeline', 'When do you need this done?', '¿Para cuándo necesita que esté listo?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ DRYWALL — COMMERCIAL (9 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('drywall', 'commercial', 1, 'project_type', 'What type of project — tenant build-out, new construction, renovation, or repair?', '¿Qué tipo de proyecto — acondicionamiento de local, construcción nueva, renovación, o reparación?', 'select', '["tenant_buildout","new_construction","renovation","repair","demolition_rebuild"]', 1),
('drywall', 'commercial', 2, 'building_type', 'What type of building?', '¿Qué tipo de edificio?', 'select', '["office","retail","restaurant","medical","warehouse","apartment","other"]', 1),
('drywall', 'commercial', 3, 'sqft_estimate', 'What''s the approximate square footage of drywall needed?', '¿Cuál es el aproximado de pies cuadrados de tablaroca necesaria?', 'number', NULL, 0),
('drywall', 'commercial', 4, 'scope', 'Is this hang only, hang and finish, or finish only?', '¿Es solo colgar, colgar y acabar, o solo acabar?', 'select', '["hang_only","hang_and_finish","finish_only","patch_repair"]', 1),
('drywall', 'commercial', 5, 'fire_rated', 'Do you need fire-rated or moisture-resistant board?', '¿Necesita tablaroca resistente al fuego o a la humedad?', 'select', '["standard","fire_rated","moisture_resistant","both","unsure"]', 0),
('drywall', 'commercial', 6, 'ceiling_height', 'What''s the ceiling height?', '¿Cuál es la altura del techo?', 'select', '["standard_8_9","10_12","above_12","varies"]', 0),
('drywall', 'commercial', 7, 'has_plans', 'Do you have plans or specs?', '¿Tiene planos o especificaciones?', 'boolean', NULL, 0),
('drywall', 'commercial', 8, 'union_job', 'Is this a union job?', '¿Es trabajo sindicalizado?', 'boolean', NULL, 0),
('drywall', 'commercial', 9, 'timeline', 'When does drywall need to be completed?', '¿Para cuándo necesita que la tablaroca esté terminada?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ FRAMING — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('framing', 'residential', 1, 'project_type', 'What''s the project — new home, addition, remodel, or repair?', '¿Cuál es el proyecto — casa nueva, ampliación, remodelación, o reparación?', 'select', '["new_home","addition","remodel","repair","garage","deck"]', 1),
('framing', 'residential', 2, 'sqft_estimate', 'About how many square feet?', '¿Aproximadamente cuántos pies cuadrados?', 'number', NULL, 1),
('framing', 'residential', 3, 'num_stories', 'How many stories?', '¿Cuántos pisos?', 'select', '["1","2","3_plus"]', 1),
('framing', 'residential', 4, 'material', 'Wood frame or steel?', '¿Estructura de madera o acero?', 'select', '["wood","steel","unsure"]', 0),
('framing', 'residential', 5, 'timeline', 'When does framing need to start?', '¿Cuándo necesita que empiece la estructura?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ FRAMING — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('framing', 'commercial', 1, 'project_type', 'What type of project — new construction, tenant build-out, or renovation?', '¿Qué tipo de proyecto — construcción nueva, acondicionamiento de local, o renovación?', 'select', '["new_construction","tenant_buildout","renovation","addition"]', 1),
('framing', 'commercial', 2, 'building_type', 'What type of building?', '¿Qué tipo de edificio?', 'select', '["office","retail","restaurant","warehouse","apartment","medical","industrial","other"]', 1),
('framing', 'commercial', 3, 'sqft_estimate', 'What''s the total square footage?', '¿Cuál es el total de pies cuadrados?', 'number', NULL, 1),
('framing', 'commercial', 4, 'num_stories', 'How many stories?', '¿Cuántos pisos?', 'number', NULL, 1),
('framing', 'commercial', 5, 'material', 'Wood frame, metal stud, or structural steel?', '¿Estructura de madera, poste metálico, o acero estructural?', 'select', '["wood","metal_stud","structural_steel","mixed"]', 1),
('framing', 'commercial', 6, 'scope', 'Is this rough framing only, or does it include backing and blocking?', '¿Es solo estructura básica, o incluye respaldos y bloques?', 'select', '["rough_only","rough_and_backing","full_scope"]', 0),
('framing', 'commercial', 7, 'trusses_or_stick', 'Trusses or stick-built?', '¿Armaduras prefabricadas o construidas en sitio?', 'select', '["trusses","stick_built","engineered","unsure"]', 0),
('framing', 'commercial', 8, 'has_plans', 'Do you have structural plans?', '¿Tiene planos estructurales?', 'boolean', NULL, 1),
('framing', 'commercial', 9, 'union_job', 'Is this a union job?', '¿Es trabajo sindicalizado?', 'boolean', NULL, 0),
('framing', 'commercial', 10, 'timeline', 'When does framing need to start?', '¿Cuándo necesita que empiece la estructura?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ FLOORING — RESIDENTIAL (6 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('flooring', 'residential', 1, 'flooring_type', 'What type of flooring are you interested in — hardwood, tile, LVP, carpet, or something else?', '¿Qué tipo de piso le interesa — madera, azulejo, LVP, alfombra, u otro?', 'select', '["hardwood","tile","lvp_lvt","carpet","laminate","epoxy","unsure"]', 1),
('flooring', 'residential', 2, 'new_or_replace', 'Is this new flooring, or replacing existing?', '¿Es piso nuevo, o reemplazar lo existente?', 'select', '["new","replace","refinish"]', 1),
('flooring', 'residential', 3, 'room_count', 'How many rooms or areas?', '¿Cuántas habitaciones o áreas?', 'number', NULL, 1),
('flooring', 'residential', 4, 'sqft_estimate', 'About how many square feet total?', '¿Aproximadamente cuántos pies cuadrados en total?', 'number', NULL, 0),
('flooring', 'residential', 5, 'subfloor_condition', 'Do you know what''s under the current floor — concrete, plywood, or not sure?', '¿Sabe qué hay debajo del piso actual — concreto, triplay, o no está seguro?', 'select', '["concrete","plywood","unsure"]', 0),
('flooring', 'residential', 6, 'timeline', 'When do you want the flooring installed?', '¿Para cuándo quiere que se instale el piso?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ FLOORING — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('flooring', 'commercial', 1, 'building_type', 'What type of space — office, retail, restaurant, warehouse, or other?', '¿Qué tipo de espacio — oficina, retail, restaurante, bodega, u otro?', 'select', '["office","retail","restaurant","warehouse","medical","school","apartment","other"]', 1),
('flooring', 'commercial', 2, 'flooring_type', 'What flooring material — VCT, LVT, carpet tile, polished concrete, epoxy, or tile?', '¿Qué material de piso — VCT, LVT, alfombra modular, concreto pulido, epóxico, o azulejo?', 'select', '["vct","lvt","carpet_tile","polished_concrete","epoxy","tile","hardwood","other"]', 1),
('flooring', 'commercial', 3, 'sqft_estimate', 'What''s the approximate square footage?', '¿Cuál es el aproximado de pies cuadrados?', 'number', NULL, 1),
('flooring', 'commercial', 4, 'new_or_replace', 'Is this new flooring or replacing existing?', '¿Es piso nuevo o reemplazo del existente?', 'select', '["new","replace","overlay"]', 1),
('flooring', 'commercial', 5, 'demolition_needed', 'Does the old flooring need to be removed?', '¿Necesita que se retire el piso viejo?', 'boolean', NULL, 0),
('flooring', 'commercial', 6, 'subfloor_prep', 'Does the subfloor need leveling or moisture mitigation?', '¿El subpiso necesita nivelación o mitigación de humedad?', 'select', '["ready","needs_leveling","needs_moisture","unsure"]', 0),
('flooring', 'commercial', 7, 'occupied', 'Will the space be occupied, or can we work after hours?', '¿El espacio estará ocupado, o podemos trabajar fuera de horario?', 'boolean', NULL, 1),
('flooring', 'commercial', 8, 'material_provided', 'Are you providing the material, or is this supply and install?', '¿Usted proporciona el material, o es suministro e instalación?', 'boolean', NULL, 0),
('flooring', 'commercial', 9, 'has_plans', 'Do you have a floor plan or specs?', '¿Tiene un plano o especificaciones?', 'boolean', NULL, 0),
('flooring', 'commercial', 10, 'timeline', 'When does flooring need to be completed?', '¿Para cuándo necesita que el piso esté terminado?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ LANDSCAPING — RESIDENTIAL (5 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('landscaping', 'residential', 1, 'service_type', 'What are you looking for — regular lawn care, a landscape project, tree work, or something else?', '¿Qué busca — mantenimiento regular de jardín, un proyecto de paisajismo, trabajo de árboles, u otra cosa?', 'select', '["lawn_care","landscape_design","hardscaping","irrigation","tree_service","cleanup","lighting","other"]', 1),
('landscaping', 'residential', 2, 'lot_size', 'About how big is the yard or property?', '¿Aproximadamente qué tan grande es el patio o propiedad?', 'select', '["small_under_quarter_acre","medium_quarter_to_half","large_half_to_1_acre","over_1_acre"]', 1),
('landscaping', 'residential', 3, 'front_back_both', 'Front yard, back yard, or both?', '¿Jardín delantero, trasero, o ambos?', 'select', '["front","back","both","side_yard"]', 1),
('landscaping', 'residential', 4, 'recurring', 'Is this a one-time project or are you looking for ongoing service?', '¿Es un proyecto de una sola vez o busca servicio continuo?', 'select', '["one_time","weekly","biweekly","monthly"]', 0),
('landscaping', 'residential', 5, 'timeline', 'When would you like to get started?', '¿Cuándo le gustaría empezar?', 'text', NULL, 1);
--> statement-breakpoint

-- ═══ LANDSCAPING — COMMERCIAL (10 questions) ═══
INSERT INTO trade_intake_templates (trade_type, scope_level, question_order, question_key, question_text, question_text_es, field_type, options_json, required) VALUES
('landscaping', 'commercial', 1, 'property_type', 'What type of property — apartment complex, office park, HOA, retail, or other?', '¿Qué tipo de propiedad — complejo de apartamentos, parque de oficinas, HOA, retail, u otro?', 'select', '["apartment_complex","office_park","hoa","retail","hotel","hospital","school","other"]', 1),
('landscaping', 'commercial', 2, 'service_type', 'What do you need — maintenance, landscape install, irrigation, or a full redesign?', '¿Qué necesita — mantenimiento, instalación de paisaje, irrigación, o rediseño completo?', 'select', '["maintenance","landscape_install","irrigation","hardscape","tree_service","full_redesign"]', 1),
('landscaping', 'commercial', 3, 'property_size', 'About how many acres or square feet?', '¿Aproximadamente cuántas acres o pies cuadrados?', 'text', NULL, 1),
('landscaping', 'commercial', 4, 'num_buildings', 'How many buildings or structures on the property?', '¿Cuántos edificios o estructuras hay en la propiedad?', 'number', NULL, 0),
('landscaping', 'commercial', 5, 'recurring', 'Is this a one-time project, or are you looking for an ongoing contract?', '¿Es un proyecto de una vez, o busca un contrato continuo?', 'select', '["one_time","weekly","biweekly","monthly","seasonal"]', 1),
('landscaping', 'commercial', 6, 'current_provider', 'Do you currently have a landscaping company, or is this a new contract?', '¿Actualmente tiene una empresa de jardinería, o es un contrato nuevo?', 'select', '["replacing_current","new_contract","additional_services"]', 0),
('landscaping', 'commercial', 7, 'irrigation_system', 'Is there an existing irrigation system?', '¿Hay un sistema de irrigación existente?', 'boolean', NULL, 0),
('landscaping', 'commercial', 8, 'has_specs', 'Do you have an RFP, scope of work, or property map?', '¿Tiene una solicitud de propuesta, alcance de trabajo, o mapa de la propiedad?', 'boolean', NULL, 0),
('landscaping', 'commercial', 9, 'hoa_requirements', 'Are there HOA or municipality requirements we should know about?', '¿Hay requisitos de HOA o municipales que debamos saber?', 'boolean', NULL, 0),
('landscaping', 'commercial', 10, 'timeline', 'When does this need to start?', '¿Cuándo necesita que esto empiece?', 'text', NULL, 1);
