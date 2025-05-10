insert into agricultural_diagnosis.remote_service_interface (id, createdAt, updatedAt, config, serviceId, name, description, type, url)
values  (14, '2025-03-29 00:27:25.822399', '2025-04-30 20:34:30.000000', '{"path": "/detect/result/{taskId}", "method": "GET"}', 5, '', null, '', ''),
        (15, '2025-03-29 00:28:23.497976', '2025-04-30 20:44:08.000000', '{"path": "/classify/result/{taskId}", "method": "GET"}', 5, '', null, '', ''),
        (28, '2025-04-15 15:41:38.195954', '2025-04-30 20:44:12.000000', '{"path": "/versions", "method": "GET"}', 5, '', null, '', ''),
        (169, '2025-04-25 15:19:29.426814', '2025-04-30 20:44:15.000000', '{"path": "/detect/{model_name}/{version}", "method": "POST"}', 5, '', null, '', ''),
        (170, '2025-04-25 15:20:33.368991', '2025-04-30 20:34:50.000000', '{"path": "/classify/{model_name}/{version}", "method": "POST"}', 5, '', null, '', '');