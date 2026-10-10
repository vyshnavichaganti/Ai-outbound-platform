from backend.workers.worker_status import workers

workers_list = ["Worker1", "Worker2", "Worker3"]

def assign_worker(lead_id):

    worker = workers_list[(lead_id - 1) % len(workers_list)]

    workers[worker] = "Busy"

    return worker