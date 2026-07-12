import Foundation
import CoreLocation

protocol LocationServiceDelegate: AnyObject {
    func locationServiceDidUpdate(location: CLLocation, name: String)
    func locationServiceDidFail(error: Error)
}

final class LocationService: NSObject, CLLocationManagerDelegate {
    static let shared = LocationService()
    private let manager = CLLocationManager()
    private var completion: ((Result<(latitude: Double, longitude: Double, name: String), Error>) -> Void)?
    private var isRequesting = false

    weak var delegate: LocationServiceDelegate?

    private override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    var authorizationStatus: CLAuthorizationStatus {
        return manager.authorizationStatus
    }

    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }

    func detectLocation(completion: @escaping (Result<(latitude: Double, longitude: Double, name: String), Error>) -> Void) {
        self.completion = completion
        isRequesting = true

        let status = manager.authorizationStatus
        if status == .notDetermined {
            manager.requestWhenInUseAuthorization()
        } else if status == .authorizedWhenInUse || status == .authorizedAlways {
            manager.startUpdatingLocation()
        } else {
            completion(.failure(LocationError.permissionDenied))
            isRequesting = false
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard isRequesting, let location = locations.last else { return }
        manager.stopUpdatingLocation()
        isRequesting = false

        let lat = location.coordinate.latitude
        let lng = location.coordinate.longitude

        let geocoder = CLGeocoder()
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, _ in
            var name = "\(String(format: "%.2f", lat))°, \(String(format: "%.2f", lng))°"
            if let placemark = placemarks?.first {
                let parts = [placemark.locality, placemark.country].compactMap { $0 }
                if !parts.isEmpty { name = parts.joined(separator: ", ") }
            }
            self?.completion?(.success((lat, lng, name)))
            self?.completion = nil
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        guard isRequesting else { return }
        manager.stopUpdatingLocation()
        isRequesting = false
        completion?(.failure(error))
        completion = nil
        delegate?.locationServiceDidFail(error: error)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if isRequesting {
            if status == .authorizedWhenInUse || status == .authorizedAlways {
                manager.startUpdatingLocation()
            } else if status == .denied || status == .restricted {
                isRequesting = false
                completion?(.failure(LocationError.permissionDenied))
                completion = nil
            }
        }
    }

    enum LocationError: Error {
        case permissionDenied
    }
}
