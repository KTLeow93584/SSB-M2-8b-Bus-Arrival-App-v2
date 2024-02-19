import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Table from 'react-bootstrap/Table';

import { useState, useEffect } from 'react';

function BusServiceList({ id, services, onBusServiceRetrievedCallback = null }) {
  const msPerMinute = 60000;

  // Fetch bus arrival data on-the-fly as the user types in the bus stop ID.
  useEffect(() => {
    // Refresh Bus Info every 5 seconds. 1 second = 1000 milliseconds.
    const timerId = setInterval(() => {
      // Debug
      console.log("[On Timer Refresh] Fetching Bus Data.");

      onFetchBusData(id, onBusServiceRetrievedCallback);
    }, 5000);

    return (() => clearInterval(timerId));
  });

  return (
    <>
      <Row className="mt-1">
        <Col className="col-12 d-flex flex-column align-items-center mt-3">
          <h2 className="fs-4 fw-bold">Bus Stop [{id}]</h2>
        </Col>
      </Row>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th className="col-1 text-center">Bus Number</th>
            <th className="col-2 text-center">Operator</th>
            <th className="col-3 text-center">Next Bus #1</th>
            <th className="col-3 text-center">Next Bus #2</th>
            <th className="col-3 text-center">Next Bus #3</th>
          </tr>
        </thead>
        <tbody>
          {
            services.map((service, index) => {
              const busArrivalETANext1 = service.next ? Math.ceil(service.next.duration_ms / msPerMinute) : null;
              const etaResult1 = busArrivalETANext1 <= 0 ? "Now" : (pluralize(busArrivalETANext1, "minute"));
              const arrivalTime1 = service.next ? formatDateToTime(new Date(service.next.time)) : null;

              const busArrivalETANext2 = service.next2 ? Math.ceil(service.next2.duration_ms / msPerMinute) : null;
              const etaResult2 = busArrivalETANext2 <= 0 ? "Now" : (pluralize(busArrivalETANext2, "minute"));
              const arrivalTime2 = service.next2 ? formatDateToTime(new Date(service.next2.time)) : null;

              const busArrivalETANext3 = service.next3 ? Math.ceil(service.next3.duration_ms / msPerMinute) : null;
              const etaResult3 = busArrivalETANext3 <= 0 ? "Now" : (pluralize(busArrivalETANext3, "minute"));
              const arrivalTime3 = service.next3 ? formatDateToTime(new Date(service.next3.time)) : null;

              // Debug
              //console.log("Results.", [{ ETA: busArrivalETANext1, time: arrivalTime1 }, { ETA: busArrivalETANext2, time: arrivalTime2 }, { ETA: busArrivalETANext3, time: arrivalTime3 }])

              return (
                <tr key={`bus-service-${index}`}>
                  <td className="col-1 text-center">
                    {service.no ?? "N/A"}
                  </td>
                  <td className="col-2 text-center">
                    {service.operator ?? "N/A"}
                  </td>
                  <td className="col-3 text-center">
                    {service.next ? `${arrivalTime1} (${etaResult1})` : "N/A"}
                  </td>
                  <td className="col-3 text-center">
                    {service.next2 ? `${arrivalTime2} (${etaResult2})` : "N/A"}
                  </td>
                  <td className="col-3 text-center">
                    {service.next3 ? `${arrivalTime3} (${etaResult3})` : "N/A"}
                  </td>
                </tr>
              );
            })
          }
        </tbody>
      </Table>
    </>
  );
}

async function onFetchBusData(busStopId, setBusServicesCallback = null) {
  if (!busStopId) {
    // Debug
    console.log("[On Fetch Bus Data from API] Empty Bus Stop ID, early exit called.");
    return;
  }

  const response = await fetch(`https://arrivelah2.busrouter.sg/?id=${busStopId}`);
  const data = await response.json();

  try {
    // Debug
    //console.log("Data.", data);

    if (data.services === null || data.services === undefined)
      throw new Error("Invalid Bus Stop ID");
    else if (data.services.length === 0)
      throw new Error("Zero Bus Service Active");

    data.services = data.services.sort((service1, service2) => service1.no - service2.no);

    if (setBusServicesCallback !== null)
      setBusServicesCallback(data.services);

    // Debug
    console.log("[On Fetch Bus Data from API] Fetch Success.");
  }
  catch (error) {
    if (setBusServicesCallback !== null)
      setBusServicesCallback(null);

    // Debug
    console.log("[On Fetch Bus Data from API] Fetch Failed. Error: ", error);
  }
}

function formatDateToReadableText(date) {
  return date.getDate().toString().padStart(2, "0") + "/" + date.getMonth().toString().padStart(2, "0") +
    "/" + date.getFullYear() + "/" + date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0") + ":" +
    date.getSeconds().toString().padStart(2, "0");
}

function formatDateToTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const suffix = hours < 12 ? "AM" : "PM";

  return hours + ":" + minutes + " " + suffix;
}

function pluralize(valueToCompare, text) {
  return valueToCompare + " " + (valueToCompare >= 2 ? (text + "s") : text);
}

function RenderInvalidBusStopId() {
  return (
    <Row>
      <Col className="col-12 d-flex flex-column align-items-center mt-3">
        <h4>Unable to retrieve bus services for this bus stop ID.</h4>
      </Col>
    </Row>
  );
}

function RenderEmptyBusStopIdInput() {
  return (
    <Row>
      <Col className="col-12 d-flex flex-column align-items-center mt-3">
        <h4>Begin the API call process by entering a Bus Stop ID.</h4>
      </Col>
    </Row>
  );
}

function App() {
  const [busStopId, setBusStopId] = useState('');
  const [busServices, setBusServices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedDate, setLastUpdatedDate] = useState(new Date());

  function handleInputChange(event) {
    setBusStopId(event.target.value)
  }

  // Fetch bus arrival data on-the-fly as the user types in the bus stop ID.
  useEffect(() => {
    onFetchBusData(busStopId, setBusServices).then(() => {
      setLoading(false);
      setLastUpdatedDate(new Date());
    });
  }, [busStopId]);

  return (
    <Container fluid className="d-flex flex-column align-items-center">
      <Row>
        <Col className="col-12 d-flex flex-column align-items-center mt-3">
          <h1 className="mt-3">Bus Arrival App</h1>
        </Col>
      </Row>
      <Row>
        <Col className="col-12 d-flex flex-column align-items-center mt-3">
          <input className="mt-3"
            type="text"
            value={busStopId}
            onChange={handleInputChange}
            placeholder="Enter Bus Stop ID"
          />
          {loading && <p>Loading...</p>}
        </Col>
      </Row>
      {
        busStopId.trim().length > 0 ? (
          <Row>
            <Col className="col-12 d-flex flex-column align-items-center mt-3">
              <p className="fs-6 text-center text-danger my-0 py-0">Last Updated at: {formatDateToReadableText(lastUpdatedDate)}</p>
            </Col>
          </Row>
        ) : null
      }
      {
        (busServices && busStopId.trim().length > 0) ?
          <BusServiceList id={busStopId} services={busServices} onBusServiceRetrievedCallback={setBusServices} /> :
          (busStopId.trim().length > 0 ? RenderInvalidBusStopId() : RenderEmptyBusStopIdInput())
      }
    </Container>
  )
}

export default App
